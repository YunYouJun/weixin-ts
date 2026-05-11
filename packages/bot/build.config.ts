import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    'src/node',
  ],
  declaration: 'node16',
  clean: true,
})
