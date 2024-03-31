const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");

async function chunkData(scrapedData, link) {
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 512, chunkOverlap: 0 });
    const chunkedData = [];

    for (const item of scrapedData) {
        const output = await splitter.createDocuments([item.content]);
        chunkedData.push(...output.map(chunk => ({ title: item.title, link: link, content: chunk.pageContent })));
    }

    return chunkedData;
}

module.exports = { chunkData };
