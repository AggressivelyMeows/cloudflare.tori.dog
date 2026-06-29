export type Storybook = {
  storybook: string
  title: string
  description: string
  category: string
  complexity: number
  pages: {
    title: string
    path: string
  }[]
}