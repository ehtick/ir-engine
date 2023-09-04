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

import { IHips, TFVectorPose, XYZ } from '../Types'
import { remap } from '../utils/helpers'
import Vector from '../utils/vector'

/**
 * Calculates Hip rotation and world position
 * @param {Array} lm3d : array of 3D pose vectors from tfjs or mediapipe
 * @param {Array} lm2d : array of 2D pose vectors from tfjs or mediapipe
 */
export const calcHips = (lm3d: TFVectorPose, lm2d: Omit<TFVectorPose, 'z'>) => {
  //Find 2D normalized Hip and Shoulder Joint Positions/Distances
  const hipLeft2d = Vector.fromArray(lm2d[23])
  const hipRight2d = Vector.fromArray(lm2d[24])
  const shoulderLeft2d = Vector.fromArray(lm2d[11])
  const shoulderRight2d = Vector.fromArray(lm2d[12])
  const hipCenter2d = hipLeft2d.lerp(hipRight2d, 0.5)
  const shoulderCenter2d = shoulderLeft2d.lerp(shoulderRight2d, 0.5)
  const spineLength = hipCenter2d.distance(shoulderCenter2d)

  const hips: IHips = {
    position: {
      x: 0, // clamp(hipCenter2d.x - 0.4, -1, 1), //subtract .4 to bring closer to 0,0 center
      y: 0,
      z: 0 // clamp(spineLength - 1, -2, 0)
    },
    rotation: Vector.rollPitchYaw(lm3d[23], lm3d[24])
  }

  //fix -PI, PI jumping
  if (hips.rotation.y > 0.5) {
    hips.rotation.y -= 2
  }
  hips.rotation.y += 0.5
  //Stop jumping between left and right shoulder tilt
  if (hips.rotation.z > 0) {
    hips.rotation.z = 1 - hips.rotation.z
  }
  if (hips.rotation.z < 0) {
    hips.rotation.z = -1 - hips.rotation.z
  }
  const turnAroundAmountHips = remap(Math.abs(hips.rotation.y), 0.2, 0.4)
  hips.rotation.z *= 1 - turnAroundAmountHips
  hips.rotation.x = 0 //temp fix for inaccurate X axis

  const spine = Vector.rollPitchYaw(lm3d[11], lm3d[12])
  //fix -PI, PI jumping
  if (spine.y > 0.5) {
    spine.y -= 2
  }
  spine.y += 0.5
  //Stop jumping between left and right shoulder tilt
  if (spine.z > 0) {
    spine.z = 1 - spine.z
  }
  if (spine.z < 0) {
    spine.z = -1 - spine.z
  }
  //fix weird large numbers when 2 shoulder points get too close
  const turnAroundAmount = remap(Math.abs(spine.y), 0.2, 0.4)
  spine.z *= 1 - turnAroundAmount
  spine.x = 0 //temp fix for inaccurate X axis

  return rigHips(hips, spine)
}

/**
 * Converts normalized rotations to radians and estimates world position of hips
 * @param {Object} hips : hip position and rotation values
 * @param {Object} spine : spine position and rotation values
 */
export const rigHips = (hips: IHips, spine: Vector | XYZ) => {
  //convert normalized values to radians
  if (hips.rotation) {
    hips.rotation.x *= Math.PI
    hips.rotation.y *= Math.PI
    hips.rotation.z *= Math.PI
  }

  spine.x *= Math.PI
  spine.y *= Math.PI
  spine.z *= Math.PI

  return {
    Hips: hips,
    Spine: spine as XYZ
  }
}