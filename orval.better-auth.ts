// Fills in what Better Auth leaves out of its OpenAPI schema
type Schema = { [key: string]: unknown }
type Spec = {
  paths: Record<string, Record<string, { responses: Record<string, Schema> }>>
  components: { schemas: Record<string, Schema> }
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const json = (schema: Schema) => ({
  description: 'Success',
  content: { 'application/json': { schema } },
})

export default function betterAuth(spec: Spec): Spec {
  const schemas = spec.components.schemas
  const props = (name: string) => schemas[name].properties as Record<string, Schema>

  props('Organization').locale = { type: 'string', enum: ['en', 'it'] }
  props('Organization').metadata = {
    type: 'string',
    description: 'JSON text, for example {"setup":"pending"}',
  }
  props('Member').role = { type: 'string', enum: ['owner', 'admin', 'viewer'] }
  props('Invitation').role = { type: 'string', enum: ['admin', 'viewer'] }
  props('Invitation').status = {
    type: 'string',
    enum: ['pending', 'accepted', 'rejected', 'canceled'],
  }

  schemas.MemberUser = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      image: { type: ['string', 'null'] },
    },
    required: ['id', 'name', 'email'],
  }
  schemas.FullMember = {
    allOf: [
      ref('Member'),
      { type: 'object', properties: { user: ref('MemberUser') }, required: ['user'] },
    ],
  }
  schemas.FullOrganization = {
    allOf: [
      ref('Organization'),
      {
        type: 'object',
        properties: {
          members: { type: 'array', items: ref('FullMember') },
          invitations: { type: 'array', items: ref('Invitation') },
        },
        required: ['members', 'invitations'],
      },
    ],
  }

  const paths = spec.paths
  paths['/organization/get-full-organization'].get.responses['200'] = json({
    oneOf: [ref('FullOrganization'), { type: 'null' }],
  })
  paths['/organization/update-member-role'].post.responses['200'] = json(ref('Member'))
  paths['/one-tap/callback'].post.responses['200'] = json({
    type: 'object',
    properties: { token: { type: 'string' }, user: ref('User') },
    required: ['token', 'user'],
  })

  return spec
}
