name: "Feature Request"
description: "Suggest a new feature or improvement"
title: "[FEATURE] Short summary"
labels: [enhancement]
assignees: ''
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem / Need
      description: What problem does this feature solve?
      placeholder: Describe the issue you are facing.
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Suggested Solution
      description: How would you like to see this resolved?
      placeholder: Provide details on the desired feature or behavior.
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives Considered
      description: Have you considered any alternative approaches?
      placeholder: Describe any other solutions you've considered.

  - type: checkboxes
    id: scope
    attributes:
      label: Target Areas
      options:
        - label: CLI
        - label: Web UI
        - label: API
        - label: Core
        - label: Mobile/Desktop

  - type: input
    id: priority
    attributes:
      label: Priority
      placeholder: Low / Medium / High
