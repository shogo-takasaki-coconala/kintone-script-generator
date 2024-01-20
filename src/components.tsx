import { html } from 'hono/html'
import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://unpkg.com/htmx.org@1.9.3"></script>
        <script src="https://unpkg.com/hyperscript.org@0.9.9"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://unpkg.com/@highlightjs/cdn-assets@11.9.0/styles/github.min.css">
        <title>Hono + htmx</title>
      </head>
      <body>
        <div class="p-4">
          <h1 class="text-4xl font-bold mb-4"><a href="/">Kintone Script Generator</a></h1>
          <p class="text-l">Kintoneアプリで関連レコードの数をカウントするJavaScriptコードを出力します</p>
          ${children}
        </div>
      </body>
    </html>
  `
})

export const Show = () => (
  <form hx-post="/show" hx-swap="outerHTML" class="mb-4">
    <div class="mb-2">
      <h2 class="text-xl">1. 関連付けの条件を指定してください</h2>
      <div class='flex flex-col gap-4'>
        <div class="flex gap-8">
          <div class="flex gap-4 items-center">
            <label for="fieldNameForForeignKey" class="form-label">外部キー(子アプリ側)</label>
            <input name="fieldNameForForeignKey" type="text"
                   class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5"
                   placeholder='ルックアップ_0'
            />
          </div>
          <div class="flex gap-4 items-center">
            <label for="fieldNameForPrimaryKey" class="form-label">主キー(親アプリ側)</label>
            <input name="fieldNameForPrimaryKey" type="text"
                   class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5"
                   placeholder='association_number'
            />
          </div>
        </div>
        <h2 class="text-xl">2. 関連付けの条件を指定してください</h2>
        <div class="flex gap-8">
          <div class="flex gap-4 items-center">
            <label for="appId" class="form-label">更新対象となるアプリID</label>
            <input name="appId" type="number" class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5"
                   placeholder='100'/>
          </div>
          <div class="flex gap-4 items-center">
            <label for="targetFieldName" class="form-label">更新対象となるフィールド名</label>
            <input name="targetFieldName" type="text"
                   class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5"
                   placeholder='activityHistoryCount'/>
          </div>
        </div>
      </div>
    </div>
    <button class="text-white bg-blue-700 hover:bg-blue-800 rounded-lg px-5 py-2 text-center" type="submit">
      JavaScriptのコードを生成する
    </button>
  </form>
)
