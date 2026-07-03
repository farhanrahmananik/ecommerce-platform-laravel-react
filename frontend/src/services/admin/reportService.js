import httpClient from '../api/httpClient.js'
export async function getReportSummary(params={}){return (await httpClient.get('/api/admin/reports/summary',{params})).data}
export async function getSalesReport(params={}){return (await httpClient.get('/api/admin/reports/sales',{params})).data}
export async function getTopProductsReport(params={}){return (await httpClient.get('/api/admin/reports/top-products',{params})).data}
export async function getStockReport(params={}){return (await httpClient.get('/api/admin/reports/stock',{params})).data}
