const express = require('express'); 
const { scrapeData } = require('./scripts/scraper');
const { storeInVectorDB } = require('./scripts/vector');
const { chunkData } = require('./scripts/chunk');
const { PromptTemplate } = require("langchain/prompts"); 
const { RetrievalQAChain } = require("langchain/chains");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { OpenAI } = require("langchain/llms/openai");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");

require('dotenv').config();

const app = express(); 
const PORT = 3001; 
const URL = 'https://www.aspca.org/pet-care/cat-care/common-cat-diseases';
const TITLE_SELECTOR = 'h3';
const CONTENT_SELECTOR = '.ready-accordion';

async function dataCollection() {
    try {
        const scrapedData = await scrapeData(URL, TITLE_SELECTOR, CONTENT_SELECTOR);
        const chunkedData = await chunkData(scrapedData, URL);
        await storeInVectorDB(chunkedData);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function testFariz() {
    console.log("Loading vector db");

    const prompt =
    PromptTemplate.fromTemplate(`
        You are a highly knowledgeable and experienced veterinary expert with access to a comprehensive database of cat diseases and their symptoms. 
        Based on the symptoms described, predict the most likely disease affecting the cat. Utilize only the information available in the RAG database, which includes sourced information on various cat diseases. 
        Format your response in JSON such as disease: the disease name, description: information about the disease. If there is not enough information provided about this disease, plase say so instead of making random speculation. 
        The symptoms mentioned must be exactly the same with the symptoms of a disease.
        This is what the cat owner have to say regarding the condition of their cat: {prompt}
    `);

    const formattedPrompt = await prompt.format({
      prompt: 
        //  "swelling, red skin patches, diarrhea, bad breath, weight loss"
        //  "skin lesions, dandruff"
         "Seizure, paralysis, loss of appetite"
        //  "Change in appetite (either increased or decreased), Excessive thirst/increase in water consumption",
    }); 

    const vectorStore = await HNSWLib.load(
      "cat_diseases_data.index",
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPEN_AI_KEY,
      })
    );

    const chain = RetrievalQAChain.fromLLM(
      new OpenAI({
        openAIApiKey: process.env.OPEN_AI_KEY,
        temperature: 0,
      }),
      vectorStore.asRetriever(),
      { returnSourceDocuments: true, },
    );

    const res = await chain._call({
      query: formattedPrompt,
    });
    
    const parsedData = JSON.parse(res.text.replace(/(\w+):/g, '"$1":'));

    if (parsedData) {
        let disease = parsedData.disease;
        let description = parsedData.description;

        console.log("Disease:", disease);
        console.log("Description:", description);
        console.log([...new Set(res.sourceDocuments.map(document => document.metadata.link))]);
    }
}

app.listen(PORT, (error) => { 
    if (!error) {
        console.log("Server is Successfully Running, and App is listening on port " + PORT);
        testFariz();
        // dataCollection()
    } else {
        console.log("Error occurred, server can't start", error);
    }
});
