// TODO: implement VectorDBStore class to handle interactions with the vector database, including storing, retrieving, and managing vector embeddings

import type { VectorDBStoreInterface } from '../types/VectorDBStoreInterface.js'

export class VectorDBStore implements VectorDBStoreInterface {
  insertToDB(rawDocument: string, metaData: object): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Inserting document into vector database...')
      console.log('Raw Document:', rawDocument)
      console.log('Metadata:', metaData)
      // TODO: implement logic to insert the document into the vector database
      resolve()
    })
  }
}
