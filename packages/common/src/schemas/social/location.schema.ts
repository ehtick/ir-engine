/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import type { Static } from '@feathersjs/typebox'
import { getValidator, querySyntax, Type } from '@feathersjs/typebox'

import { OpaqueType } from '@etherealengine/common/src/interfaces/OpaqueType'
import { TypedString } from '../../types/TypeboxUtils'
import { SceneID } from '../projects/scene.schema'
import { dataValidator, queryValidator } from '../validators'
import { locationAdminSchema } from './location-admin.schema'
import { locationAuthorizedUserSchema } from './location-authorized-user.schema'
import { locationBanSchema } from './location-ban.schema'
import { locationSettingSchema } from './location-setting.schema'

export const locationPath = 'location'

export const locationMethods = ['find', 'get', 'create', 'patch', 'remove'] as const

export type RoomCode = OpaqueType<'RoomCode'> & string
export type LocationID = OpaqueType<'LocationID'> & string

// Main data model schema
export const locationSchema = Type.Object(
  {
    id: TypedString<LocationID>({
      format: 'uuid'
    }),
    name: Type.String(),
    sceneId: TypedString<SceneID>({
      format: 'uuid'
    }),
    slugifiedName: Type.String(),
    /** @todo review */
    isLobby: Type.Boolean(),
    /** @todo review */
    isFeatured: Type.Boolean(),
    maxUsersPerInstance: Type.Number(),
    locationSetting: Type.Ref(locationSettingSchema),
    locationAdmin: Type.Optional(Type.Ref(locationAdminSchema)),
    locationAuthorizedUsers: Type.Array(Type.Ref(locationAuthorizedUserSchema)),
    locationBans: Type.Array(Type.Ref(locationBanSchema)),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
  },
  { $id: 'Location', additionalProperties: false }
)
export interface LocationType extends Static<typeof locationSchema> {}

export interface LocationDatabaseType
  extends Omit<LocationType, 'locationSetting' | 'locationAuthorizedUsers' | 'locationBans'> {}

// Schema for creating new entries
export const locationDataSchema = Type.Pick(
  locationSchema,
  ['name', 'sceneId', 'slugifiedName', 'isLobby', 'isFeatured', 'maxUsersPerInstance', 'locationSetting'],
  {
    $id: 'LocationData'
  }
)
export interface LocationData extends Static<typeof locationDataSchema> {}

// Schema for updating existing entries
export const locationPatchSchema = Type.Partial(locationSchema, {
  $id: 'LocationPatch'
})
export interface LocationPatch extends Static<typeof locationPatchSchema> {}

// Schema for allowed query properties
export const locationQueryProperties = Type.Pick(locationSchema, [
  'id',
  'name',
  'sceneId',
  'slugifiedName',
  'isLobby',
  'isFeatured',
  'maxUsersPerInstance'
])
export const locationQuerySchema = Type.Intersect(
  [
    querySyntax(locationQueryProperties, {
      name: {
        $like: Type.String()
      },
      sceneId: {
        $like: TypedString<SceneID>({
          format: 'uuid'
        })
      }
    }),
    // Add additional query properties here
    Type.Object({ action: Type.Optional(Type.String()) }, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export interface LocationQuery extends Static<typeof locationQuerySchema> {}

export const locationValidator = /* @__PURE__ */ getValidator(locationSchema, dataValidator)
export const locationDataValidator = /* @__PURE__ */ getValidator(locationDataSchema, dataValidator)
export const locationPatchValidator = /* @__PURE__ */ getValidator(locationPatchSchema, dataValidator)
export const locationQueryValidator = /* @__PURE__ */ getValidator(locationQuerySchema, queryValidator)