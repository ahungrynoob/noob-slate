import assert from 'assert'
import { fixtures } from '../../../support/fixtures'
import { Editor } from 'slate'

const withTest = editor => {
  const { isInline, isVoid } = editor

  editor.isInline = element => {
    return element.inline === true ? true : isInline(element)
  }

  editor.isVoid = element => {
    return element.void === true ? true : isVoid(element)
  }

  return editor
}

describe('slate', () => {
  fixtures(__dirname, 'interfaces', ({ module }) => {
    let { input, test, output } = module
    if (Editor.isEditor(input)) {
      input = withTest(input)
    }
    const result = test(input)
    assert.deepEqual(result, output)
  })
})
