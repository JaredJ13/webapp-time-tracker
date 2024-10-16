const functions = require('firebase-functions');
const Replicate = require('replicate');
const cors = require('cors');

// Initialize CORS
const corsHandler = cors({ origin: true });

const summarizeTasks = functions.https.onRequest((req, res) => {
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

module.exports = { summarizeTasks };
