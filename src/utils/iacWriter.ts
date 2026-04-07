import { mkdir, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import type { StoredDocument } from '../types/StoredDocument.js'

function getPromptFolderName(promptLabel: string): string {
  return promptLabel.trim().toLowerCase().replace(/\s+/g, '-')
}

async function getNextExperimentName(promptLabel: string): Promise<string> {
  const promptFolder = path.resolve('outputs', getPromptFolderName(promptLabel))

  await mkdir(promptFolder, { recursive: true })

  const entries = await readdir(promptFolder, { withFileTypes: true })

  const experimentNumbers = entries
    .filter(
      (entry) => entry.isDirectory() && entry.name.startsWith('experiment-'),
    )
    .map((entry) => {
      const match = entry.name.match(/experiment-(\d+)/)
      return match ? Number(match[1]) : 0
    })

  const nextNumber =
    experimentNumbers.length > 0 ? Math.max(...experimentNumbers) + 1 : 1

  return `experiment-${nextNumber}`
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

export async function saveIaCResults(
  promptLabel: string,
  query: string,
  generatedContent: string,
  context: string,
  retrievedDocuments: StoredDocument[],
  modelName: string,
): Promise<void> {
  const promptFolderName = getPromptFolderName(promptLabel)
  const experimentName = await getNextExperimentName(promptLabel)

  // TODO: refactor so that output folder structure uses model name as well, to make it easier to compare results across models
  console.log(modelName)

  const folderPath = path.resolve('outputs', promptFolderName, experimentName)

  await mkdir(folderPath, { recursive: true })

  const timestamp = getTimestamp()

  const generatedMd = `# Generated IaC

## Prompt Label
${promptLabel}

## Query
${query}

## Output
\`\`\`text
${generatedContent}
\`\`\`
`

  await writeFile(
    path.join(folderPath, `generated-${timestamp}.md`),
    generatedMd,
    'utf8',
  )

  const contextMd = `# Retrieval Context

## Prompt Label
${promptLabel}

${context}
`

  await writeFile(
    path.join(folderPath, `context-${timestamp}.md`),
    contextMd,
    'utf8',
  )

  await writeFile(
    path.join(folderPath, `retrieved-${timestamp}.json`),
    JSON.stringify(retrievedDocuments, null, 2),
    'utf8',
  )

  console.log(`Saved experiment: ${promptFolderName}/${experimentName}`)
}
