
<template>
    <div class="ve_container">
        <!-- 搜索 -->
        <el-form ref="queryForm" :inline="true" :model="params">
            <el-form-item label="角色" prop="role">
                <el-select clearable v-model="role" placeholder="请选择">
                    <el-option
                        v-for="item in roleList"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id"
                    ></el-option>
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button
                    type="primary"
                    @click="onSubmit(params, getDataList)"
                >
                    {{ admin.userSearch.name }}
                </el-button>
                <el-button @click="resetForm(queryForm, params, getDataList)">
                    重置
                </el-button>
            </el-form-item>
        </el-form>
        <el-button
            title="弹窗式"
            v-permission="['adminAdd']"
            size="small"
            type="primary"
            @click="handleEdit(admin.userAdd.name)"
        >
            {{ admin.userAdd.name }}
        </el-button>
        <el-button
            title="路由式"
            v-permission="['adminAdd']"
            size="small"
            type="primary"
            @click="handleEditRoute(admin.userAdd.name)"
        >
            {{ admin.userAdd.name }}
        </el-button>
        <!-- 列表 -->
        <el-table :data="tableData" style="width: 100%">
            <el-table-column prop="name" label="用户名"></el-table-column>
            <el-table-column prop="auth_name" label="角色"></el-table-column>

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
            <el-table-column fixed="right" label="操作">
                <template v-slot:default="{ row }">
                    <el-button
                        v-permission="['editAdmin']"
                        @click.prevent="handleEdit(admin.userEdit.name, row)"
                        type="primary"
                        size="small"
                    >
                        {{ admin.userEdit.name }}
                    </el-button>
                    <el-button
                        v-permission="['removeAdmin']"
                        @click.prevent="handleDel(row.id)"
                        type="danger"
                        size="small"
                    >
                        {{ admin.removeUser.name }}
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
    </div>
</template>
<script>
export default {
    data: () => ({
        description: "用户信息查询与设置",
        admin: {
            userSearch: { name: "查询" },
            userAdd: { name: "添加" },
            userEdit: { name: "编辑" },
            removeUser: { name: "删除" },
        },
    }),
};
</script>

<script setup>
import UsersEdit from "./components/UsersEdit";
import { reactive, toRefs, ref, onMounted, getCurrentInstance } from "vue";
import { useRoute, useRouter } from "vue-router";
//?导入公共查询方法
import {
    onSubmit,
    resetForm,
    handleSizeChange,
    handleCurrentChange,
    getAsyncRouteName,
} from "@/views/layoutpages/common";

const { proxy } = getCurrentInstance();
const route = useRoute();
const router = useRouter();
const rowData = ref(null);
const dialogTitle = ref("");
const showDialog = ref(false);
const queryForm = ref(null);
const tableData = ref([]);
const params = reactive({
    role: isNaN(route.query.id * 1) ? "" : route.query.id * 1,
    limit: 10,
    page: 1,
    total: 0,
});
const { role, limit, page, total } = toRefs(params);

const roleList = ref([]);

/**
 * @description:添加or编辑事件
 * @param {*}
 * @return {*}
 */
const handleEdit = (title, row = null) => {
    showDialog.value = true;
    dialogTitle.value = title;
    rowData.value = row;
};
/**
 * @description: 添加页面路由式
 * @param {*}
 * @return {*}
 */
const handleEditRoute = async (title) => {
    let path = "system/components/UsersEditRoute";
    const toName = await getAsyncRouteName(title, path, "add", {
        router,
        route,
    });
    router.push({ name: toName });
};
/**
 * @description: 获取角色列表
 * @param {*}
 * @return {*}
 */
const getRoleList = async () => {
    const { code, data } = await VE_API.system.roleList(
        {
            page: 1,
            limit: 10,
        },
        { Global: false }
    );
    if (code == "200") {
        console.log(data.total);
        const { list } = data;
        /* total = (data.total);
        page = data.current_page; 
        limit = parseInt(data.per_page);*/
        roleList.value = list;
    }
};
/**
 * @description: dialog事件
 * @param {*}
 * @return {*}
 */
const handelDialog = (e) => {
    showDialog.value = e;
    getDataList();
};
/**
 * @description:用户状态切换
 * @param {*}
 * @return {*}
 */
const handelSwitch = async (val, row) => {
    if (row.id == undefined) return;
    row.load = 1;
    const { code } = await VE_API.system.userStatus(
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
};
/**删除行数据
 * @description:
 * @param {*}
 * @return {*}
 */
const handleDel = (id) => {
    proxy
        .$confirm("此操作将永久删除该数据, 是否继续?", "提示", {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "error",
        })
        .then(async () => {
            const { code } = await VE_API.system.userDel({ id });
            if (code == "00") {
                getDataList();
            }
        })
        .catch(() => {
            proxy.$message({
                type: "info",
                message: "已取消删除",
            });
        });
};
/**
 * @description: 获取列表数据
 * @param {*}
 * @return {*}
 */
const getDataList = async () => {
    let res = await VE_API.system.userList(params);
    if (res.code == "200") {
        // const { per_page, page, total, data } = data;
        params.limit = res.data.per_page;
        params.page = res.data.current_page;
        params.total = res.data.total;
        tableData.value = res.data.data;
    }
};
onMounted(async () => {
    await getRoleList();
    await getDataList();
    // maxHeight(pagination, queryForm, toolBar, ve_max_height);
});
</script>

<style lang="scss" scoped></style>
