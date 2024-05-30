/* eslint-disable no-case-declarations */
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
import { debounce } from 'lodash'
import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { useTranslation } from 'react-i18next'

import { staticResourcePath, StaticResourceType } from '@etherealengine/common/src/schema.type.module'
import { Engine } from '@etherealengine/ecs/src/Engine'
import { AssetsPanelCategories } from '@etherealengine/editor/src/components/assets/AssetsPanelCategories'
import { AssetSelectionChangePropsType } from '@etherealengine/editor/src/components/assets/AssetsPreviewPanel'
import { AssetLoader } from '@etherealengine/engine/src/assets/classes/AssetLoader'
import { getState, NO_PROXY, State, useHookstate } from '@etherealengine/hyperflux'
import { BiSolidDownArrow, BiSolidRightArrow } from 'react-icons/bi'
import { HiMagnifyingGlass } from 'react-icons/hi2'
import { twMerge } from 'tailwind-merge'
import Button from '../../../../../primitives/tailwind/Button'
import Input from '../../../../../primitives/tailwind/Input'
import LoadingView from '../../../../../primitives/tailwind/LoadingView'
import Text from '../../../../../primitives/tailwind/Text'
import { FileIcon } from '../../Files/icon'

type FolderType = { folderType: 'folder'; assetClass: string }
type ResourceType = { folderType: 'staticResource' } & StaticResourceType

type CategorizedStaticResourceType = FolderType | ResourceType

const AssetsPreviewContext = createContext({ onAssetSelectionChanged: (props: AssetSelectionChangePropsType) => {} })

const ResourceFile = ({ resource }: { resource: StaticResourceType }) => {
  const { onAssetSelectionChanged } = useContext(AssetsPreviewContext)

  const assetType = AssetLoader.getAssetType(resource.key)
  const [_, drag, preview] = useDrag(() => ({
    type: assetType,
    item: {
      url: resource.url
    },
    multiple: false
  }))

  useEffect(() => {
    if (preview) preview(getEmptyImage(), { captureDraggingState: true })
  }, [preview])

  const fullName = resource.key.split('/').at(-1)!
  const name = fullName.length > 15 ? `${fullName.substring(0, 12)}...` : fullName

  return (
    <div
      ref={drag}
      key={resource.id}
      onClick={() =>
        onAssetSelectionChanged?.({
          contentType: assetType,
          name: fullName,
          resourceUrl: resource.url,
          size: 'unknown size'
        })
      }
      className="mt-[10px] flex cursor-pointer flex-col items-center  justify-center align-middle"
    >
      <span className="mb-[5px] h-[70px] w-[70px] text-[70px]">
        <FileIcon thumbnailURL={resource.thumbnailURL} type={assetType} />
      </span>
      <span className="text-white">{name}</span>
    </div>
  )
}

type Category = {
  name: string
  object: object
  collapsed: boolean
  isLeaf: boolean
  depth: number
}

function iterativelyListTags(obj: object): string[] {
  const tags: string[] = []
  for (const key in obj) {
    tags.push(key)
    if (typeof obj[key] === 'object') {
      tags.push(...iterativelyListTags(obj[key]))
    }
  }
  return tags
}

const AssetCategory = (props: {
  data: {
    categories: Category[]
    onClick: (resource: Category) => void
    selectedCategory: Category | null
    collapsedCategories: State<{ [key: string]: boolean }>
  }
  index: number
}) => {
  const { categories, onClick, selectedCategory, collapsedCategories } = props.data
  const index = props.index
  const resource = categories[index]

  return (
    <div
      className={twMerge(
        'my-2 flex items-center gap-2 bg-[#3F3F3F] px-2 py-0.5',
        resource.depth === 0 && !resource.collapsed && 'mt-4',
        selectedCategory?.name === resource.name && 'bg-[#D9D9D9]'
      )}
      style={{ marginLeft: resource.depth * 28 }}
    >
      <Button
        variant="transparent"
        className={twMerge('m-0 p-0', resource.isLeaf && 'invisible cursor-auto')}
        title={resource.collapsed ? 'expand' : 'collapse'}
        startIcon={resource.collapsed ? <BiSolidRightArrow /> : <BiSolidDownArrow />}
        onClick={() => !resource.isLeaf && collapsedCategories[resource.name].set(!resource.collapsed)}
      />
      <div className="h-5 w-5 cursor-pointer bg-[#868686]" onClick={() => onClick(resource)} />
      <Text className="cursor-pointer" onClick={() => onClick(resource)}>
        {resource.name}
      </Text>
    </div>
  )
}

const AssetPanel = () => {
  const { t } = useTranslation()
  const collapsedCategories = useHookstate<{ [key: string]: boolean }>({})
  const categories = useHookstate<Category[]>([])
  const selectedCategory = useHookstate<Category | null>(null)
  const loading = useHookstate(false)
  const searchText = useHookstate('')
  const searchTimeoutCancelRef = useRef<(() => void) | null>(null)
  const searchedStaticResources = useHookstate<StaticResourceType[]>([])

  const CategoriesList = () => {
    return (
      <div className="mb-8 h-[100%] w-full overflow-y-auto pb-8">
        {categories.map((category, index) => (
          <AssetCategory
            key={category.name.value}
            data={{
              categories: categories.value as Category[],
              selectedCategory: selectedCategory.value,
              onClick: (resource: Category) => {
                selectedCategory.set(JSON.parse(JSON.stringify(resource)))
              },
              collapsedCategories
            }}
            index={index}
          />
        ))}
      </div>
    )
  }

  useEffect(() => {
    const result: Category[] = []
    const generateCategories = (node: object, depth = 0) => {
      for (const key in node) {
        const isLeaf = Object.keys(node[key]).length === 0
        const category = {
          name: key,
          object: node[key],
          collapsed: collapsedCategories[key].value ?? true,
          depth,
          isLeaf
        }
        result.push(category)
        if (typeof node[key] === 'object' && !category.collapsed) {
          generateCategories(node[key], depth + 1)
        }
      }
    }
    generateCategories(getState(AssetsPanelCategories))
    categories.set(result)
  }, [collapsedCategories])

  useEffect(() => {
    const staticResourcesFindApi = () => {
      const query = {
        key: { $like: `%${searchText.value}%` || undefined },
        $sort: { mimeType: 1 },
        $limit: 10000
      }

      if (selectedCategory.value) {
        const tags = [selectedCategory.value.name, ...iterativelyListTags(selectedCategory.value.object)]
        query['tags'] = {
          $or: tags.flatMap((tag) => [
            { tags: { $like: `%${tag.toLowerCase()}%` } },
            { tags: { $like: `%${tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()}%` } }
          ])
        }
      }
      Engine.instance.api
        .service(staticResourcePath)
        .find({ query })
        .then((resources) => {
          searchedStaticResources.set(resources.data)
        })
        .then(() => {
          loading.set(false)
        })
    }

    loading.set(true)

    searchTimeoutCancelRef.current?.()
    const debouncedSearchQuery = debounce(staticResourcesFindApi, 500)
    debouncedSearchQuery()

    searchTimeoutCancelRef.current = debouncedSearchQuery.cancel

    return () => searchTimeoutCancelRef.current?.()
  }, [searchText, selectedCategory])

  const ResourceItems = () => {
    if (loading.value) {
      return (
        <div className="flex items-center justify-center">
          <LoadingView className="h-4 w-4" spinnerOnly />
        </div>
      )
    }
    return searchedStaticResources.value ? (
      <>
        {searchedStaticResources.map((resource) => (
          <ResourceFile key={resource.value.id} resource={resource.get(NO_PROXY) as StaticResourceType} />
        ))}
      </>
    ) : (
      <div>{t('editor:layout.scene-assets.no-search-results')}</div>
    )
  }

  return (
    <>
      <div className="mb-1 flex h-7 bg-theme-surface-main" />
      <div className="flex h-full flex-row p-2">
        <div className="flex h-full w-[25%] flex-col gap-2">
          <Input
            placeholder={t('editor:layout.filebrowser.search-placeholder')}
            value={searchText.value}
            onChange={(e) => {
              searchText.set(e.target.value)
            }}
            className="w-full rounded bg-theme-primary text-white"
            startComponent={<HiMagnifyingGlass className="text-white" />}
          />
          <CategoriesList />
        </div>
        <div className="grid h-[100%] w-[75%] grid-cols-4 overflow-y-auto pb-8">
          <ResourceItems />
        </div>
      </div>
    </>
  )
}

export default AssetPanel