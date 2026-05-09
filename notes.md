## Modernization tasks

### Phase 1: Build modernization

- [X] get mise.toml setup
- [ ] update CI updated (remove integration for now, just setup docs and deployment)
    - [X] copy over ci files
    - [X] add secrets to repo
- [ ] merge PR for build setup

### Phase 2: test modernization

- [ ] Basically all of the tests can be turned into unit tests. I will translate *one* set of tests.
- [ ] Then get Gemini CLI to follow the patterns established in that file and get it into an agent mode where it's running tests and defining new ones.
- [ ] Once all tests pass locally, setup CI
