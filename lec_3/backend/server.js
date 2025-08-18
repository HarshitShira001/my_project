import express from 'express';

const app = express();

app.get('/',(req,res) => {
    res.send('Hello World');
});

//get a list of 5 jokes

app.get('/api/jokes',(req,res) => {
    const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "What did one ocean say to the other ocean? Nothing, they just waved.",
        "Why did the scarecrow win an award? Because he was outstanding in his field!",
        "How does a penguin build its house? Igloos it together.",
        "Why don't skeletons fight each other? They don't have the guts."
    ];
    res.send(jokes);
})
const PORT = process.env.port || 3000;

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});