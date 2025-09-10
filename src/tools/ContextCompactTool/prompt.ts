export const DESCRIPTION = 'Compress the current conversation context by removing unimportant historical information to save tokens'

export const PROMPT = `When the AI believes the current conversation context is too long and contains much historical information that is no longer needed, this tool can be used to compress the context.

Parameter description:
- reason: The AI's reason for compressing the context, e.g. "Completed a phased task and can remove related historical context"

Usage scenarios:
1. After completing a phased task, remove detailed conversation history related to that task
2. When the context contains a lot of repetitive or outdated information
3. Regularly clean up unnecessary historical information in long conversations

Notes:
- This tool will not lose any critical information, only redundant content will be removed
- The compression operation is irreversible, please use it only when necessary
- After compression, the AI will be able to handle longer subsequent conversations
- Please provide a clear reason before deciding to compress, which helps the system optimize the compression strategy

Return results:
- success: Whether the compression operation was successful
- message: Description of the compression result
- compressedSize: Compressed context size (bytes)
- originalSize: Original context size (bytes)

Usage recommendations:
- Use this tool to free up context space after completing large tasks
- Use this tool when approaching token limits
- Use regularly to maintain conversation efficiency`