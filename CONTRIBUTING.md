# Contributing to Cross-Chain Token Swap

Thank you for considering contributing to the Cross-Chain Token Swap application! This document outlines the process for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others when contributing.

## How to Contribute

### Reporting Bugs

If you find a bug in the application, please create an issue on GitHub with the following information:

1. A clear, descriptive title
2. Steps to reproduce the bug
3. Expected behavior
4. Actual behavior
5. Screenshots (if applicable)
6. Environment information (browser, OS, etc.)

### Suggesting Enhancements

We welcome suggestions for enhancements to the application. To suggest an enhancement, create an issue on GitHub with the following information:

1. A clear, descriptive title
2. A detailed description of the enhancement
3. The motivation behind the enhancement
4. Any relevant examples or mockups

### Pull Requests

We welcome pull requests for bug fixes and enhancements. To submit a pull request:

1. Fork the repository
2. Create a new branch from `main`
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
5. Submit a pull request to the `main` branch

#### Pull Request Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Include tests for new functionality
- Update documentation as needed
- Ensure your changes pass all existing tests

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Code Style

We follow a consistent code style throughout the project:

- Use TypeScript for all JavaScript files
- Use functional components with hooks for React components
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use Prettier for code formatting
- Use ESLint for linting

## Testing

We use Jest and React Testing Library for testing. To run tests:

```bash
npm test
```

## Documentation

Please update documentation as needed when making changes to the codebase. This includes:

- Updating the README.md file
- Adding or updating JSDoc comments for functions and components
- Updating any relevant documentation files

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This helps us generate changelogs and understand the purpose of each commit.

Examples:
- `feat: add token selection dropdown`
- `fix: resolve issue with bridge fee calculation`
- `docs: update README with new features`
- `refactor: improve token swap logic`

## Release Process

Our release process follows these steps:

1. Update version number in package.json
2. Update CHANGELOG.md
3. Create a new release on GitHub
4. Tag the release with the version number

## Questions?

If you have any questions about contributing, please create an issue on GitHub or reach out to the maintainers directly.

Thank you for your contributions!
