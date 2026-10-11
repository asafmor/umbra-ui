# Security policy

## Reporting a vulnerability

Please report it privately, not in a public issue or pull request.

Use GitHub's private vulnerability reporting: on the repository page open **Security > Report a
vulnerability**, or go to <https://github.com/asafmor/umbra-ui/security/advisories/new>. Only the
maintainers see the report.

Include what you can of:

- the version of `umbra-ui`, and of React and the browser;
- what an attacker can do, and what they need for it;
- a minimal reproduction.

You will get an answer through the same advisory. When a fix is needed it is released as a patch
version, and the advisory is published with credit to you unless you prefer otherwise.

## Supported versions

| Version                  | Security fixes |
| ------------------------ | -------------- |
| The latest `0.x` release | Yes            |
| Earlier releases         | No: upgrade    |

Until `1.0.0`, fixes are made on the latest minor version only.

## Scope

`umbra-ui` is a client-side component library. It renders the content your app passes to it and sends
nothing over the network. In scope: a component that turns content passed as text into markup or
script, or a flaw in the published package itself. Vulnerabilities in a dependency are best reported to
that project; tell us too if `umbra-ui` needs a release to pick up the fix.
