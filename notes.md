## Modernization tasks

### Phase 1: Build modernization

- [X] get mise.toml setup
- [X] update CI updated (remove integration for now, just setup docs and deployment)
    - [X] copy over ci files
    - [X] add secrets to repo
- [X] merge PR for build setup

### Phase 2: test modernization

- [X] Basically all of the tests can be turned into unit tests. I will translate one set of tests.
    - [X] translate a single test and get it to pass
    - [X] translate several additional tests
    - [X] see if we can translate remaining using gemini CLI
- [X] Then get Gemini CLI to follow the patterns established in that file and get it into an agent mode where it's running tests and defining new ones.
- [X] Once all tests pass locally, setup CI
    - [X] setup web tests
    - [X] setup coverage in mise
    - [X] run coverage
    - [X] adapt rest of ci.yml

### Phase 3: documentation deployment

- [X] Update doc.yml to work with new build setup

### Phase 4: coverage CI

- [X] debug / update coverage reporting and get visible code coverage on GitHub
