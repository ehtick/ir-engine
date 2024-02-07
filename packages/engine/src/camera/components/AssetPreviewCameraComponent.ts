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

import {
  UndefinedEntity,
  defineComponent,
  getMutableComponent,
  useComponent,
  useEntityContext
} from '@etherealengine/ecs'
import { CameraOrbitComponent } from '@etherealengine/spatial/src/camera/components/CameraOrbitComponent'
import { matchesEntity } from '@etherealengine/spatial/src/common/functions/MatchesUtils'
import { useEffect } from 'react'
import { ModelComponent } from '../../scene/components/ModelComponent'

export const AssetPreviewCameraComponent = defineComponent({
  name: 'AssetPreviewCameraComponent',

  onInit: (entity) => {
    return { targetModelEntity: UndefinedEntity }
  },

  onSet: (entity, component, json) => {
    if (!json) return
    if (matchesEntity.test(json.targetModelEntity)) component.targetModelEntity.set(json.targetModelEntity)
  },

  reactor: () => {
    const entity = useEntityContext()
    const previewCameraComponent = useComponent(entity, AssetPreviewCameraComponent)
    const modelComponent = useComponent(previewCameraComponent.targetModelEntity.value, ModelComponent)
    useEffect(() => {
      if (!modelComponent.scene.value) return
      const cameraOrbitComponent = getMutableComponent(entity, CameraOrbitComponent)
      cameraOrbitComponent.focusedEntities.set([previewCameraComponent.targetModelEntity.value])
      cameraOrbitComponent.refocus.set(true)
    }, [modelComponent.scene])
    return null
  }
})