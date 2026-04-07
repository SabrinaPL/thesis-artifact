import { mkdir, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import type { StoredDocument } from '../types/StoredDocument.js'

/**
 * Converts a string into a safe folder name by trimming whitespace, converting to lowercase, and replacing invalid characters with hyphens.
 * @param value - The string to convert.
 * @returns The safe folder name.
 */
function toSafeFolderName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Generates a folder name for a given prompt label by converting it to a safe format.
 * @param promptLabel - The prompt label to convert.
 * @returns The safe folder name for the prompt label.
 */
function getPromptFolderName(promptLabel: string): string {
  return toSafeFolderName(promptLabel)
}

/**
 * Generates a folder name for a given model name by converting it to a safe format.
 * @param modelName - The model name to convert.
 * @returns The safe folder name for the model name.
 */
function getModelFolderName(modelName: string): string {
  return toSafeFolderName(modelName)
}

/**
 * Generates a unique experiment folder name based on existing experiments for the given prompt label and model name, by incrementing the highest existing experiment number.
 * @param promptLabel - The prompt label for the experiment.
 * @param modelName - The model name for the experiment.
 * @returns The unique experiment folder name.
 */
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

/**
 * Generates a timestamp string in ISO format with colons and periods replaced by hyphens, to be used in filenames.
 * @returns - The formatted timestamp string.
 */
function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

/**
 * Saves the generated IaC, retrieval context, and retrieved documents for a given experiment into a structured folder hierarchy based on the prompt label and model name, with unique experiment names and timestamped filenames for traceability and organization of results.
 * @param promptLabel - The prompt label for the experiment.
 * @param query - The query used to generate the IaC.
 * @param generatedContent - The generated IaC content.
 * @param context - The retrieval context for the experiment.
 * @param retrievedDocuments - The documents retrieved for the experiment.
 * @param modelName - The model name used for the experiment.
 */
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
