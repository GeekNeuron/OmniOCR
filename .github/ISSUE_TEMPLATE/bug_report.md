name: "Bug Report"
description: "Report a reproducible bug or error"
title: "[BUG] Short summary"
labels: [bug]
body:
  - type: textarea
    id: description
    attributes:
      label: Describe the bug
      placeholder: Clear and concise bug explanation
  - type: input
    id: os
    attributes:
      label: OS / Environment
  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
  - type: textarea
    id: logs
    attributes:
      label: Logs / Screenshots (optional)
