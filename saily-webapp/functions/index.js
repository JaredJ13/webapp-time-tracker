const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const Replicate = require('replicate');
const cors = require('cors');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const wordOfTheDayDataSet = require('./assets/wordOfTheDay.json');
admin.initializeApp();

// Initialize CORS
const corsHandler = cors({ origin: true });

exports.summarizeTasks = onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        // Your existing code
        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_KEY,
        });

        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const tasks = req.body.tasks;

        if (!Array.isArray(tasks)) {
            return res.status(400).send('Invalid tasks format. Please send an array of tasks.');
        }

        const taskList = tasks.map((task) => `- ${task}`).join('\n');
        const prompt = `Summarize the following tasks into a concise paragraph, focusing on key progress and important actions. Eliminate repetitive or redundant information. The tasks are organized by task group. For each group in the summary include the group name, how many tasks for the group and how much time (hrs and mins) was spent on the group in brackets. Make sure this is in paragraph form:\n\n${taskList}`;

        const input = {
            top_k: 0,
            top_p: 0.95,
            prompt: prompt,
            max_tokens: 312,
            temperature: 0.5,
            system_prompt: "Concise, professional summary with a focus on key achievements throughout a specified time period.",
            length_penalty: 1.1,
            max_new_tokens: 312,
            stop_sequences: "<|end_of_text|>,<|eot_id|>",
            prompt_template: "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n",
            presence_penalty: 0,
            log_performance_metrics: false
        };

        try {
            const result = await replicate.run("meta/meta-llama-3-8b-instruct", { input });
            const summary = Array.isArray(result) ? result.join('') : result;

            return res.status(200).send({ summary });
        } catch (error) {
            console.error("Error during Replicate API call:", error);
            return res.status(500).send('Failed to summarize tasks.');
        }
    });
});


// SCHEDULED FUNCTIONS

// get definition for new word of the day from our dataset every day at midnight MST time
exports.wordOfTheDay = onSchedule({
    schedule: "0 0 * * *",
    timeZone: "America/Edmonton"
}, async (event) => {
    console.log('Getting the word of the day');

    // check the index of the last used word 
    let nextWordToUseIndex = 0;
    try {
        const lastWordSnapshot = await admin.firestore().collection('wordOfTheDay').orderBy('dataSetIndex', 'desc').limit(1).get();

        if (!lastWordSnapshot.empty) {
            lastWordSnapshot.docs.forEach((doc) => {
                nextWordToUseIndex = doc.data().dataSetIndex + 1;
            });
        }

        console.log(`Next word to use index  = ${nextWordToUseIndex}`);
    } catch (err) {
        console.log(`An error occurred while trying to get the last word used index from the db: ${err}`);
    }

    try {
        let wordOfTheDay = null;
        // get the word of the day from our json data set
        console.log('words data set length: ', wordOfTheDayDataSet.length)
        if (nextWordToUseIndex <= wordOfTheDayDataSet.length - 1) {
            wordOfTheDay = wordOfTheDayDataSet[nextWordToUseIndex];
        } else {
            // we've used all of the words in our dataset so lets go back to the first word
            console.log('All words have been used in the dataset, going back to first word');
            nextWordToUseIndex = 0;
            wordOfTheDay = wordOfTheDayDataSet[nextWordToUseIndex];
        }

        // call dictionary api to get word definition
        const definition = await getDictionaryDefinition(wordOfTheDay);

        if (definition) {
            console.log(`Retrieved definition for word ${wordOfTheDay}: ${definition}`);
            // check if the definition was found 
            if (definition.title !== 'No Definitions Found') {
                // store the definition in Firestore
                await admin.firestore().collection('wordOfTheDay').add({
                    word: wordOfTheDay.toLowerCase(),
                    details: definition,
                    dataSetIndex: nextWordToUseIndex
                });
                console.log(`Wrote word of the day details to firestore for ${wordOfTheDay}`);
            } else {
                console.log(`No definition found from api for word: ${wordOfTheDay}, trying the next word in the data set`);
                // try getting the next word definition in the dataset
                const definition = await getDictionaryDefinition(wordOfTheDayDataSet[nextWordToUseIndex + 1]);
                if (definition.title !== 'No Definitions Found') {
                    await admin.firestore().collection('wordOfTheDay').add({
                        word: wordOfTheDay.toLowerCase(),
                        details: definition,
                        dataSetIndex: nextWordToUseIndex + 1
                    });
                    console.log(`Wrote word of the day details to firestore for ${wordOfTheDay}`);
                } else {
                    console.log(`No definition found from api for word: ${wordOfTheDay} which was the second failed try for the word of the day today, dataset should be investigated`);
                }
            }
        } else {
            console.log(`The dictionary api call failed`);
        }
    } catch (error) {
        console.error(`Error fetching word of the day`, error);
    }

    console.log('Word of the day function completed');
});

// function to get the dictionary definition
async function getDictionaryDefinition(word) {
    try {
        let definition = null;
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

        if (response.ok) {
            definition = await response.json();
        }

        return definition;
    } catch (err) {
        console.log(`An error occurred while calling the dictionary api: ${err}`);
    }
}
