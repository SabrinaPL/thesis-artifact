import { mkdir, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import type { StoredDocument } from '../types/StoredDocument.js'

function toSafeFolderName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
}

function getPromptFolderName(promptLabel: string): string {
  return toSafeFolderName(promptLabel)
}

function getModelFolderName(modelName: string): string {
  return toSafeFolderName(modelName)
}

async function getNextExperimentName(
  promptLabel: string,
  modelName: string,
): Promise<string> {
  const promptFolder = path.resolve(
    'outputs',
    'eval',
    getPromptFolderName(promptLabel),
    getModelFolderName(modelName),
  )

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
  const modelFolderName = getModelFolderName(modelName)
  const experimentName = await getNextExperimentName(promptLabel, modelName)

  console.log(modelName)

  const folderPath = path.resolve(
    'outputs',
    'eval',
    promptFolderName,
    modelFolderName,
    experimentName,
  )

  await mkdir(folderPath, { recursive: true })

  const timestamp = getTimestamp()

  const generatedMd = `# Generated IaC

## Prompt Label
${promptLabel}

## Model
${modelName}

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

## Model
${modelName}

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

  console.log(
    `Saved experiment: ${promptFolderName}/${modelFolderName}/${experimentName}`,
  )
}
