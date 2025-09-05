import { NotebookReadTool } from '../NotebookReadTool/NotebookReadTool'

const MAX_LINES_TO_READ = 2000
const MAX_LINE_LENGTH = 2000

export const DESCRIPTION = 'Read a file from the local filesystem.'
export const PROMPT = `Reads one or multiple files from the local filesystem.

For single file reading:
- file_path: absolute path to the file
- offset: optional starting line number
- limit: optional number of lines to read

For batch file reading:
- file_path: array of absolute paths to read multiple files at once
- offset and limit apply to all files in the batch

The file_path parameter must be an absolute path, not a relative path. By default, it reads up to ${MAX_LINES_TO_READ} lines starting from the beginning of the file. You can optionally specify a line offset and limit (especially handy for long files), but it's recommended to read the whole file by not providing these parameters. Any lines longer than ${MAX_LINE_LENGTH} characters will be truncated. For image files, the tool will display the image for you. For Jupyter notebooks (.ipynb files), use the ${NotebookReadTool.name} instead.`
