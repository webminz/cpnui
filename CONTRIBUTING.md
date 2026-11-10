# Contributing

Thanks for your interest! CPN Editor is a hobby project and an experiment in agentic
coding, so it is maintained on a best-effort basis. Issues and pull requests are welcome,
but responses may take a while.

## Reporting issues

Please include:

- What you did, what you expected, and what happened
- Browser and OS
- A small `.cpn` file that reproduces the problem, if relevant

## Pull requests

1. Fork the repo and create a branch off `main`.
2. Keep changes focused; one topic per PR.
3. Run the tests and a production build before submitting:
   ```bash
   cd cpn-editor
   npx ng test --watch=false
   npm run build
   ```
4. Describe *what* changed and *why* in the PR.

## Code conventions

See [`CLAUDE.md`](CLAUDE.md) for the architecture. In short:

- Standalone Angular components, signal-based state (no RxJS for state)
- Clone state before mutating (`structuredClone`)
- TypeScript strict mode; Prettier with 100-char lines and single quotes

## AI-assisted contributions

AI-generated code is welcome; that is what this project is about. You are still
responsible for what you submit: read it, test it, and say in the PR which tools you used.
If you used an agent, updates to `CLAUDE.md` or the `backlog/` plans that helped it are
welcome too.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
