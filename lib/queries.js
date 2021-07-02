/** Database queries, used by routes.
 * @module
 */

const gql = require('graphql-tag');

/**
 * Query for control template.
 */
exports.CONTROL_QUERY = gql`
query Q($standard: String!, $control: String!) {
    control(standard_key: $standard, key: $control) {
        standard_key
        key
        name
        description
        satisfied_by {
            component_key
            implementation_status
            component {
                name
            }
            narrative {
                key
                text
            }
        }
        required_by {
            key
        }
        mapped_to {
            control {
                standard_key
                key
                name
                satisfied_by {
                    component_key
                    implementation_status
                    component {
                        name
                    }
                }
            }
        }
    }
}`;

/**
 * Query for component template.
 */
exports.COMPONENT_QUERY = gql`
query Q($component: String!) {
    component(key: $component) {
        key
        system
        name
        description
        responsible_role

        satisfies {
            standard_key
            control_key
            control {
                name
            }
            implementation_status
            narrative {
                key
                text
            }
        }

        references {
            name
            path
        }
    }
}`;
