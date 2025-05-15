name: "Feature Request"
description: "Suggest a new feature or enhancement"
title: "[FEATURE] Short summary"
labels: [enhancement]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem / Need
  - type: textarea
    id: solution
    attributes:
      label: Suggested solution
  - type: checkboxes
    id: scope
    attributes:
      label: Target areas
      options:
        - label: CLI
        - label: Web UI
        - label: API
        - label: Core
        - label: Mobile/Desktop
