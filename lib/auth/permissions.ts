import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

const statement = {
    ...defaultStatements,
    project: ["create", "share", "update", "delete"],
    apiKey: ["read", "create", "delete"],
    domain: ["read", "create", "delete"],
} as const;

const ac = createAccessControl(statement);

const member = ac.newRole({
    project: ["create"],
    apiKey: ["read"],
    domain: ["read"],
    ac: ["read"],
});

const admin = ac.newRole({
    project: ["create", "update"],
    apiKey: ["read", "create"],
    domain: ["read", "create"],
    organization: ["update"],
    invitation: ["create", "cancel"],
    member: ["create", "update", "delete"],
    team: ["create", "update", "delete"],
    ac: ["create", "read", "update", "delete"],
});


const owner = ac.newRole({
    project: ["create", "update", "delete"],
    apiKey: ["read", "create", "delete"],
    domain: ["read", "create", "delete"],
    organization: ["update", "delete"],
    invitation: ["create", "cancel"],
    member: ["create", "update", "delete"],
    team: ["create", "update", "delete"],
    ac: ["create", "read", "update", "delete"],
});


export { member, admin, owner, ac, statement };
