// Import source-map-support first
import 'source-map-support/register'

// A class with a method that will throw an error
class ErrorTester {
  constructor(private name: string) {}

  public throwError(): never {
    // Create a multi-line function to have a meaningful stack trace
    const innerFunction = () => {
      const deeperFunction = () => {
        console.log(`About to throw an error from ${this.name}`)
        throw new Error(
          `Test error from ${this.name} - TypeScript source maps should point to this line`,
        )
      }
      return deeperFunction()
    }

    return innerFunction()
  }
}

// Export a function that will throw an error
export function testSourceMaps(): never {
  const tester = new ErrorTester('SourceMapTest')
  return tester.throwError()
}
