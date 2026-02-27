// src/features/dashboard/registry/index.ts
export { DASHBOARD_REGISTRY, getDashboardConfig, getVisibleSections } from './dashboard-registry';
export type { DashboardConfig, DashboardMode, SectionConfig } from './dashboard-registry';

export { FILTER_CONFIGS, getFilterConfig, hasFilter, getFiltersByGroup } from './filter-config';
export type { FilterFieldId, FilterInputType, FilterFieldConfig } from './filter-config';

export { WIDGET_CATALOG, getWidget, getWidgetsByCategory } from './widget-catalog';
export type { WidgetMeta, WidgetCategory } from './widget-catalog';
