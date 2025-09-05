export interface Subcommand {
  name: string
  description: string
  aliases?: string[]
  call(
    args: string,
    context: any,
  ): Promise<string>
}