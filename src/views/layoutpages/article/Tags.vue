<template>
  <div class="ve_container">
    <!-- 搜索 -->
    <el-form ref="queryForm" :inline="true" :model="params">
      <el-form-item prop="params.name">
          <el-input
              clearable
              v-model="params.title"
              placeholder="名称"
          ></el-input>
      </el-form-item>
      <el-form-item>
          <el-button
              type="primary"
              @click="onSubmit(params, getDataList)"
          >
              {{ tags.tagSearch.name }}
          </el-button>
          <el-button @click="resetForm(queryForm, params, getDataList)">
              重置
          </el-button>
      </el-form-item>
      <el-table
        :data="dataList"
        style="width: 100%"
        row-key="id"
        border
        :default-expand-all =false
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="id" label="Id" sortable />
        <el-table-column prop="title" label="标题"/>
        <el-table-column prop="status" label="状态">
							<template v-slot="{ row }">
								<el-switch 
									:loading="row.load ? true : false"
									v-model="row.status"
									active-value="0"
									inactive-value="1"
									active-color="#13ce66"
									inactive-color="#ff4949"
									@change="(val) => handelSwitch(val, row)"
								>
									>
								</el-switch>
							</template>
            </el-table-column>
        <el-table-column prop="level" label="等级">
          <template v-slot="{ row }">
            <el-tag v-if="row.level == 0">一级分类</el-tag>
            <el-tag type="success" v-else-if="row.level == 1">二级分类</el-tag>
            <el-tag type="warning" v-else-if="row.level == 2" >三级分类</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="添加时间"></el-table-column>
        <el-table-column fixed="right" label="操作" width="240" v-permission="['editTag']">
                <template v-slot:default="{ row }">
                    <el-button
                        v-permission="['editTag']"
                        @click.prevent="handleEdit(tags.editTag.name, row)"
                        type="primary"
                        size="small"
                    >
                        {{ tags.editTag.name }}
                    </el-button>
                    <el-button
                        v-permission="['delTag']"
                        @click.prevent="handleDel(row.id)"
                        type="danger"
                        size="small"
                    >
                        {{ tags.delTag.name }}
                    </el-button>
                    <el-button
                        v-permission="['addChild']"
                        v-if="row.type == 0"
                        @click.prevent="handleEdit(tags.addChild.name, row)"
                        type="warning"
                        size="small"
                    >
                        {{ tags.addChild.name }}
                    </el-button>
                </template>
            </el-table-column>
    </el-table>
    </el-form>
  </div>
</template>
<script>
import TagEdit from "./components/TagEdit";
//?导入公共查询方法
import {
    onSubmit,
    resetForm,
    handleSizeChange,
    handleCurrentChange,
} from "@/views/layoutpages/common";
  export default{
    name: "Tags",
    data() {
      return {
        tags: {
            tagSearch: { name: "查询" },
            tagAdd: { name: "添加" },
            editTag: { name: "编辑" },
            delTag: { name: "删除" },
            addChild: { name: "添加子级"}
        },
        params: {
          title: ""
        },
        dataList: [], 
        limit: 10,
        page: 1,
        total: 0,
      }
    },
    created(){
      this.getData();
    },
    methods: {
      async getData() {
        let list = await VE_API.tag.tagList(this.params);
        if(list.code === 200) { 
          this.dataList = list.data;
          console.log(this.dataList);
        }
      },
      		/**
	 * @description:用户状态切换
	 * @param {*}
	 * @return {*}
	 */
	async handelSwitch  (val, row)  {
		if (row.id == undefined) return;
		const { code } = await VE_API.user.tagStatus(
			{
        id: row.id
			},
			{ Global: false }
		);
		setTimeout(() => { 
			if (code != "200") {
					row.status = val == 0 ? 1 : 0;
			}
		}, 500);
	},
    }
  }
</script>