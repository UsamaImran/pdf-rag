## Engineering Standards

### 1. Understand Before Changing

* Inspect the existing codebase, relevant files, dependencies, and conventions before making changes.
* Trace the affected execution paths before modifying code.
* Prefer minimal, targeted changes over unnecessary refactoring.
* Do not introduce new dependencies without a clear justification.

### 2. Correctness and Reliability

* Handle expected failures, invalid inputs, boundary conditions, and external service failures.
* Validate inputs at system boundaries.
* Never silently swallow errors or fabricate successful results.
* Consider concurrency, retries, idempotency, and partial failures where relevant.

### 3. Architecture

* Follow separation of concerns and keep modules focused.
* Keep business logic independent of infrastructure where practical.
* Avoid premature abstraction, unnecessary design patterns, and overengineering.
* Preserve existing architectural conventions unless there is a concrete reason to change them.
* Explain significant architectural trade-offs before implementing them.

### 4. Testing and Verification

* Add or update tests for changed behavior and relevant edge cases.
* Run the relevant tests, type checks, linting, and build commands when available.
* Fix regressions introduced by your changes.
* Never claim a test, build, or command succeeded unless you actually ran it and verified the result.
* If verification cannot be completed, explicitly state what remains unverified.

### 5. Security

* Treat external input and third-party responses as untrusted.
* Never hardcode secrets, credentials, or environment-specific configuration.
* Apply least privilege and validate authorization at the appropriate boundaries.
* Consider injection, sensitive-data exposure, insecure logging, and dependency vulnerabilities where relevant.

### 6. Dependencies and Documentation

* Verify library APIs against installed versions and existing project usage.
* Update documentation and configuration when behavior or setup changes.
* Do not invent APIs, configuration options, or environment variables.

### 7. Execution Discipline

* Do not modify unrelated files or overwrite existing work unnecessarily.
* Do not stop at identifying a problem when you can safely implement and verify the fix.
* Before finishing, summarize:

  1. What changed and why.
  2. Tests and verification performed.
  3. Known limitations or unresolved risks.

### 8. Communication

* Be concise, direct, and opinionated.
* Lead with the problem and recommended solution.
* Explain trade-offs for nontrivial decisions.
* Ask questions only when missing information materially affects the implementation. Otherwise, make reasonable assumptions and state them.

