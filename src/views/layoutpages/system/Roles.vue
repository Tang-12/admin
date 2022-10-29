<template>
    <div class="ve_container">
        <!-- 搜索 -->
        <el-form ref="queryForm" :inline="true" :model="params">
            <el-form-item label="" prop="name">
                <el-input
                    clearable
                    v-model="name"
                    placeholder="请输入"
                ></el-input>
            </el-form-item>
            <el-form-item>
                <el-button
                    type="primary"
                    @click="onSubmit(params, getDataList)"
                >
                    {{ roles.search.name }}
                </el-button>
            </el-form-item>
        </el-form>

        <!-- 列表 -->
        <ve-table
            :table="{
                data: tableData,
            }"
            :pagination="{
                onSizeChange: (val) =>
                    handleSizeChange(val, params, getDataList),
                onCurrentChange: (val) =>
                    handleCurrentChange(val, params, getDataList),
                currentPage: page, 
                total: total,
            }"
        >
            <template #tool_bar>
                <el-button
                    size="small"
                    type="primary"
                    @click="handleEdit(roles.add.name)"
                >
                    {{ roles.add.name }}
                </el-button>
            </template>
            <el-table-column prop="name" label="名称"></el-table-column>
            <el-table-column
                prop="desc"
                label="描述"
                width="120"
            ></el-table-column>
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
            <el-table-column
                prop="created_at"
                label="添加时间"
            ></el-table-column>
            <el-table-column fixed="right" label="操作">
                <template v-slot:default="{ row }">
                    <el-button
                        v-permission="['editRole']"
                        @click.prevent="handleEdit(roles.edit.name, row)"
                        type="primary"
                        size="small"
                    >
                        {{ roles.edit.name }}
                    </el-button>
                    <el-button
                        v-permission="['delRole']"
                        @click.prevent="handleDel(row.id)"
                        type="danger"
                        size="small"
                    >
                        {{ roles.del.name }}
                    </el-button>
                    <el-button
                        v-permission="['member']"
                        @click.prevent="allMember(row.id)"
                        type="info"
                        size="small"
                    >
                        {{ roles.member.name }}
                    </el-button>
                </template>
            </el-table-column>
        </ve-table>

        <!-- 编辑组件 -->
        <role-edit
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
        description: "角色信息查询与设置",
        roles: {
            search: { name: "查询" },
            add: { name: "添加" },
            edit: { name: "编辑" },
            del: { name: "删除" },
            member: { name: "查看成员", toPath: true }, //topath:true 需要设置跳转路径
        },
    }),
};
</script>

<script setup>
import RoleEdit from "./components/RoleEdit";
import {
    reactive,
    toRefs,
    computed,
    ref,
    onMounted,
    getCurrentInstance,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import { findName } from "../common";

//*导入公共查询方法
import {
    onSubmit,
    resetForm,
    handleSizeChange,
    handleCurrentChange,
} from "@/views/layoutpages/common";

const { proxy } = getCurrentInstance();
const route = useRoute();
const router = useRouter();
const store = useStore();
const menuList = computed(() => store.getters.menuList).value;

const rowData = ref(null);
const dialogTitle = ref("");
const showDialog = ref(false);

const queryForm = ref(null);
const tableData = ref([]);
const params = reactive({
    name: "",
    limit: 10,
    page: 1,
    total: 0, 
});
const { name, limit, page, total } = toRefs(params);

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
 * @description: dialog事件
 * @param {*}
 * @return {*}
 */
const handelDialog = (e) => {
    showDialog.value = e;
    getDataList();
};
/**
 * @description:状态切换
 * @param {*}
 * @return {*}
 */
const handelSwitch = async (val, row) => {
    if (row.id == undefined) return;
    row.load = 1;
    const { code } = await VE_API.system.roleStatus(
        {
            id: row.id
        }, 
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
            const { code } = await VE_API.system.roleDel({ id });
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
 * @description:查看成员
 * @param {*}
 * @return {*}
 */
const allMember = (id) => {
    // 获取当前path的id
    let pathId = route.name.slice(route.name.lastIndexOf("-") + 1);
    // 获取要跳转到的路由
    // const toName = findName("member", "system/Users", pathId, menuList);
    router.push({ path: "system/Users", query: { id } });
};
/**
 * @description: 获取列表数据
 * @param {*}
 * @return {*}
 */
const getDataList = async () => {
    const { code, data } = await VE_API.system.roleList(params);
    if (code == "200") {
        // const { limit, page, total } = data.data;
        // params.limit = Array.from(data.per_page);
        params.page = data.current_page;
        params.total = data.total;
        tableData.value = data.data;
    }
};
onMounted(async () => {
    await getDataList();
    // maxHeight(pagination, queryForm, toolBar, ve_max_height);
});
</script>

<style lang="scss" scoped></style>
