import { J as current_component, K as bind_props, L as ensure_array_like, M as attr, F as escape_html, B as pop, N as stringify, z as push, G as store_get, I as unsubscribe_stores } from "../../chunks/index.js";
import { w as writable } from "../../chunks/index2.js";
function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
function Navigation($$payload, $$props) {
  let handleFileChangeEvent = $$props["handleFileChangeEvent"];
  let isLoading = $$props["isLoading"];
  $$payload.out += `<nav class="w-full bg-blue-500 p-4 text-white"><h1 class="text-2xl font-bold">Upload .sas7bdat Files</h1> <input type="file" accept=".sas7bdat" multiple class="mb-4 rounded border border-gray-300 p-2"> `;
  if (isLoading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="flex items-center justify-center space-x-2"><div class="h-8 w-8 animate-spin rounded-full border-4 border-dashed border-white"></div> <div>Loading...</div></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></nav>`;
  bind_props($$props, { handleFileChangeEvent, isLoading });
}
function DatasetList($$payload, $$props) {
  push();
  let datasets = $$props["datasets"];
  let selectedDataset = $$props["selectedDataset"];
  let onSelectDataset = $$props["onSelectDataset"];
  $$payload.out += `<aside class="w-1/4 bg-white p-4 shadow-md"><h2 class="mb-4 text-xl font-bold">Datasets</h2> `;
  if (datasets.size > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(Array.from(datasets.keys()));
    $$payload.out += `<ul class="pl-5"><!--[-->`;
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let datasetName = each_array[$$index];
      $$payload.out += `<li><button type="button"${attr("class", `cursor-pointer text-gray-700 ${stringify(datasetName === selectedDataset ? "bg-red-500 text-white" : "")}`)}>${escape_html(datasetName)}</button></li>`;
    }
    $$payload.out += `<!--]--></ul>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<p class="text-gray-500">No datasets to display.</p>`;
  }
  $$payload.out += `<!--]--></aside>`;
  bind_props($$props, { datasets, selectedDataset, onSelectDataset });
  pop();
}
function DataTable($$payload, $$props) {
  push();
  let data = $$props["data"];
  let selectedColumns = $$props["selectedColumns"];
  let columnOrder = $$props["columnOrder"];
  let onReorderColumns = $$props["onReorderColumns"];
  function isColumnSelected(column) {
    return selectedColumns.has(column);
  }
  const each_array = ensure_array_like(columnOrder);
  const each_array_1 = ensure_array_like(data.slice(0, 10));
  $$payload.out += `<table class="min-w-full bg-white"><thead><tr><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let key = each_array[$$index];
    if (isColumnSelected(key)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<th draggable="true" class="cursor-move border-b border-gray-200 bg-gray-100 px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-200">${escape_html(key)}</th>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></tr></thead><tbody><!--[-->`;
  for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
    let row = each_array_1[$$index_2];
    const each_array_2 = ensure_array_like(columnOrder);
    $$payload.out += `<tr><!--[-->`;
    for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
      let key = each_array_2[$$index_1];
      if (isColumnSelected(key)) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<td class="border-b border-gray-200 px-4 py-2 text-sm text-gray-700">${escape_html(row[key])}</td>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]-->`;
    }
    $$payload.out += `<!--]--></tr>`;
  }
  $$payload.out += `<!--]--></tbody></table>`;
  bind_props($$props, {
    data,
    selectedColumns,
    columnOrder,
    onReorderColumns
  });
  pop();
}
function VariableList($$payload, $$props) {
  push();
  let selectedColumns = $$props["selectedColumns"];
  let columnOrder = $$props["columnOrder"];
  let onColumnToggle = $$props["onColumnToggle"];
  let onReorderVariables = $$props["onReorderVariables"];
  const each_array = ensure_array_like(columnOrder);
  $$payload.out += `<aside class="w-1/4 bg-white p-4 shadow-md"><h2 class="mb-4 text-xl font-bold">Variables</h2> <ul class="pl-5"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let variable = each_array[$$index];
    $$payload.out += `<li draggable="true" class="cursor-move py-1 hover:bg-gray-100"><label class="flex items-center space-x-2"><input type="checkbox"${attr("name", variable)}${attr("value", variable)}${attr("checked", selectedColumns.has(variable), true)}> <span>${escape_html(variable)}</span></label></li>`;
  }
  $$payload.out += `<!--]--></ul></aside>`;
  bind_props($$props, {
    selectedColumns,
    columnOrder,
    onColumnToggle,
    onReorderVariables
  });
  pop();
}
function Footer($$payload, $$props) {
  let uploadTime = $$props["uploadTime"];
  let numColumns = $$props["numColumns"];
  let numRows = $$props["numRows"];
  console.log(uploadTime, numColumns, numRows);
  $$payload.out += `<footer class="flex w-full items-center justify-between bg-gray-800 p-4 text-white"><div>`;
  if (uploadTime !== void 0) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p class="text-sm">Upload and processing time: ${escape_html(uploadTime)} seconds</p>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> <div>`;
  if (numColumns !== void 0 && numRows !== void 0) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p class="text-sm">Variables: ${escape_html(numColumns)}
				Records: ${escape_html(numRows)}</p>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></footer>`;
  bind_props($$props, { uploadTime, numColumns, numRows });
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  const datasetsStore = writable(/* @__PURE__ */ new Map());
  const selectedDatasetStore = writable(null);
  const isLoadingStore = writable(false);
  const selectedColumnsStore = writable(/* @__PURE__ */ new Map());
  const columnOrderStore = writable(/* @__PURE__ */ new Map());
  onDestroy(() => {
  });
  async function handleFileChangeEvent(event) {
    return;
  }
  function handleColumnToggle(column, checked) {
    selectedColumnsStore.update((selectedColumns) => {
      const currentDataset = store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore);
      if (currentDataset) {
        let columns = selectedColumns.get(currentDataset) || /* @__PURE__ */ new Set();
        if (checked) {
          columns.add(column);
        } else {
          columns.delete(column);
        }
        selectedColumns.set(currentDataset, columns);
      }
      return selectedColumns;
    });
  }
  let selectedDataset = null;
  function handleColumnReorder(newOrder) {
    const currentDataset = store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore);
    if (currentDataset) {
      columnOrderStore.update((orders) => {
        orders.set(currentDataset, newOrder);
        return orders;
      });
    }
  }
  {
    if (store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore)) {
      selectedDataset = store_get($$store_subs ??= {}, "$datasetsStore", datasetsStore).get(store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore));
    } else {
      selectedDataset = null;
    }
  }
  if (selectedDataset) {
    const currentDataset = store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore);
    if (currentDataset) {
      const allColumns = Object.keys(selectedDataset.data[0] || {});
      const initialColumns = new Set(allColumns.slice(0, 5));
      selectedColumnsStore.update((selectedColumns) => {
        selectedColumns.set(currentDataset, initialColumns);
        return selectedColumns;
      });
      columnOrderStore.update((orders) => {
        if (!orders.has(currentDataset)) {
          orders.set(currentDataset, allColumns);
        }
        return orders;
      });
    }
  }
  $$payload.out += `<main class="flex min-h-screen flex-col bg-gray-100">`;
  Navigation($$payload, {
    handleFileChangeEvent,
    isLoading: store_get($$store_subs ??= {}, "$isLoadingStore", isLoadingStore)
  });
  $$payload.out += `<!----> <div class="flex flex-1 overflow-hidden">`;
  DatasetList($$payload, {
    datasets: store_get($$store_subs ??= {}, "$datasetsStore", datasetsStore),
    selectedDataset: store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore),
    onSelectDataset: (dataset) => selectedDatasetStore.set(dataset)
  });
  $$payload.out += `<!----> <section class="flex-1 overflow-x-auto p-4">`;
  if (selectedDataset) {
    $$payload.out += "<!--[-->";
    DataTable($$payload, {
      data: selectedDataset.data,
      selectedColumns: store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore) ? store_get($$store_subs ??= {}, "$selectedColumnsStore", selectedColumnsStore).get(store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore)) ?? /* @__PURE__ */ new Set() : /* @__PURE__ */ new Set(),
      columnOrder: store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore) ? store_get($$store_subs ??= {}, "$columnOrderStore", columnOrderStore).get(store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore)) ?? [] : [],
      onReorderColumns: handleColumnReorder
    });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></section> `;
  if (selectedDataset) {
    $$payload.out += "<!--[-->";
    VariableList($$payload, {
      variables: selectedDataset.details.columns,
      selectedColumns: store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore) ? store_get($$store_subs ??= {}, "$selectedColumnsStore", selectedColumnsStore).get(store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore)) ?? /* @__PURE__ */ new Set() : /* @__PURE__ */ new Set(),
      columnOrder: store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore) ? store_get($$store_subs ??= {}, "$columnOrderStore", columnOrderStore).get(store_get($$store_subs ??= {}, "$selectedDatasetStore", selectedDatasetStore)) ?? [] : [],
      onColumnToggle: handleColumnToggle,
      onReorderVariables: handleColumnReorder
    });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div> `;
  Footer($$payload, {
    class: "fixed bottom-0 left-0 right-0 w-full bg-gray-800 p-4 text-white",
    uploadTime: selectedDataset?.processingTime.toFixed(2),
    numColumns: selectedDataset?.details.num_columns,
    numRows: selectedDataset?.details.num_rows
  });
  $$payload.out += `<!----></main>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
