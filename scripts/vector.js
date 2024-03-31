const { Document } = require("langchain/document");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");

async function storeInVectorDB(chunkedData) {
    console.log(chunkedData)
    try {
        const documents = chunkedData.map(
          (item, index) =>
            new Document({
              pageContent: item.content,
              metadata: { id: index + 1, title: item.title, link: item.link }
            })
        );
    
        const vectorStore = await HNSWLib.fromDocuments(
          documents,
          new OpenAIEmbeddings({ openAIApiKey: process.env.OPEN_AI_KEY })
        );
    
        await vectorStore.save("cat_diseases_data.index");
        console.log("Data stored in vector database successfully!");
    } catch(error) {
        console.error("Error while storing data in vector database!\n", error)
    }
}

module.exports = { storeInVectorDB };