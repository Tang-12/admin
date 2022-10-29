<template>
    <div class="ve_container">
        <!-- 搜索 --> 
        <el-form ref="queryForm">
					<el-form-item>
						<el-form-item>
							<el-input
									clearable
									v-model="params.username"
									placeholder="请输入用户姓名"
							></el-input>
						</el-form-item>
						&nbsp;
						<el-button type="primary" @click="getDataList()">
							{{users.search.name}}
						</el-button>
					</el-form-item>
        </el-form>
				<el-button
					v-permission="['userAdd']"
					size="small"
					type="primary"
					@click="handleEdit(users.add.name)"
					>
					{{users.add.name}}
					</el-button>
        <el-table :data="dataList" style="width: 100%">
            <el-table-column prop="name" label="用户名" />
            <el-table-column prop="email" label="邮箱" />
            <el-table-column prop="articles_count" label="文章数量" />
            <el-table-column prop="status" label="状态" v-permission="['userStatus']">
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
            <el-table-column prop="created_at" label="注册时间"/>
            <el-table-column fixed="right" label="操作">
							<template v-slot:default="{ row }">
								<el-button
									v-permission="['userEdit']"
									@click.prevent="handleEdit(users.edit.name, row)"
									type="primary"
									size="small"
								>
									{{users.edit.name}}
								</el-button>
								<el-button
									v-permission="['removeUser']"
									@click.prevent="handleDel(row.id)"
									type="danger"
									size="small"
								>
									{{users.del.name}}
								</el-button>
							</template>
            </el-table-column>
        </el-table>

        <!-- 编辑组件 -->
        <users-edit
					v-if="showDialog"
					:rowData="rowData"
					:title="dialogTitle"
					:showDialog="showDialog"
					@closeDialog="handelDialog($event)"
        />
				<el-pagination background layout="prev, pager, next" :total="total" @current-change="currentChange" />
    </div>
</template>
<script>
import UsersEdit from "./components/UsersEdit";
//导入公共查询方法
import {
    onSubmit,
    resetForm,
    handleSizeChange,
    handleCurrentChange,
    getAsyncRouteName,
} from "@/views/layoutpages/common";
	export default{
	name: "Users",
	data(){
		return {
			users: {
				search: { name: "查询" },
				add: { name: "添加" },
				edit: { name: "编辑" },
				del: { name: "删除" },
			},
			params:{
				username: "",
				limit: 20,
			},
			dataList: [],
			showDialog: false,
			dialogTitle: null,
			rowData: {},
			total: 0,
		}
	}, //
	components: { 
		UsersEdit
	},
	created(){
		this.getDataList();
	},
	methods: {
		async getDataList () {
		let data = await VE_API.user.userList(this.params);
		// console.log(data);
		this.dataList = data.data.data;
		this.total = data.data.total;
		},
		/**
	 * @description:添加or编辑事件
	 * @param {*}
	 * @return {*}
	 */
	handleEdit (title, row = null) {
		this.showDialog = true;
		this.dialogTitle = title;
		this.rowData = row;
	},
		/**
	 * @description:用户状态切换
	 * @param {*}
	 * @return {*}
	 */
	async handelSwitch  (val, row)  {
		if (row.id == undefined) return;
		row.load = 1;
		const { code } = await VE_API.user.userStatus(
			{
					id: row.id
			},
			{ Global: false }
		);
		setTimeout(() => {
			row.load = 0;
			if (code != "200") {
					row.status = val == 0 ? 1 : 0;
			}
		}, 500);
	},
	/**
	 * 关闭弹窗
	 */
	handelDialog(e) {
		this.showDialog = e;
		this.getDataList();
	},
	/**
	 * 分页
	 */
	currentChange(val) {
		this.params.limit = val;
		this.getDataList(this.params);
	}
	}
}
</script>