// This file provides a type definition for `process.env` to inform TypeScript
// that this object is available in the execution environment (e.g., Google Studio),
// even though this is client-side code.

// By augmenting the global NodeJS namespace, we add our custom environment
// variable to the existing `process.env` type definition without causing
// a redeclaration error.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY?: string;
    }
  }
}

// This empty export is required to treat this file as a module and not
// a script. This is important for global augmentation to work correctly.
export {};
