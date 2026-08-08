/**
 * LOREBASE - Settings Tab
 * Plugin settings interface integrated with Obsidian Settings
 */

import { App, PluginSettingTab, Setting, setIcon } from 'obsidian';
import { t } from '../localization';
import type LorebasePlugin from '../main';
import type { SettingsLayoutMode } from '../types';
import { renderAboutSection } from './sections/about';
import {
    ICON_CARD_CUSTOMIZATION,
    ICON_GENERAL,
    ICON_INTEGRATIONS,
    ICON_MEDIA,
} from './sections/constants';
import { renderCardCustomizationSettings, renderGeneralSettings } from './sections/general';
import { getImportSectionDesc, getImportSectionLabel, renderImportSection } from './sections/import';
import { renderIntegrationsSection } from './sections/integrations';
import { renderMediaSettings } from './sections/library';
import type { CollapsibleGroupElements, MediaTabScope, MediaTypeKey, SettingsSectionContext } from './sections/types';

type SettingsSectionId =
    | 'general'
    | 'customization'
    | 'media'
    | 'integrations'
    | 'import'
    | 'about';

interface SettingsSectionDefinition {
    id: SettingsSectionId;
    label: string;
    description: string;
    icon: string;
    render: (container: HTMLElement) => void;
}

interface DeclarativeSettingPage {
    type: 'page';
    name: string;
    desc: string;
    items: Array<{
        name: string;
        desc: string;
        render: (setting: Setting) => void;
    }>;
}

interface DeclarativeSettingsHost {
    update?: () => void;
}

export class LorebaseSettingTab extends PluginSettingTab {
    plugin: LorebasePlugin;
    private activeMediaTabs: Record<MediaTabScope, MediaTypeKey> = {
        statusLabels: 'games',
        mediaSettings: 'games',
        integrationTemplates: 'games',
    };
    private activeSettingsSection: SettingsSectionId = 'general';
    private openAccordionSections = new Set<SettingsSectionId>();

    constructor(app: App, plugin: LorebasePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    getSettingDefinitions(): DeclarativeSettingPage[] {
        const sections = this.getSectionDefinitions(this.getSectionContext());
        return sections.map((section) => ({
            type: 'page',
            name: section.label,
            desc: section.description,
            items: [{
                name: section.label,
                desc: section.description,
                render: (setting) => {
                    setting.settingEl.empty();
                    setting.settingEl.addClass('lorebase-settings-declarative-section');
                    section.render(setting.settingEl);
                },
            }],
        }));
    }

    display(): void {
        const scrollState = this.captureScrollState();
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('lorebase-settings');

        const topbar = containerEl.createDiv({ cls: 'lorebase-settings-topbar' });
        new Setting(topbar)
            .setName(t('settingsTitle'))
            .setHeading()
            .settingEl.addClass('lorebase-settings-main-heading');
        this.renderLayoutModeToggle(topbar);
        this.renderSupportBlock(containerEl);

        const layoutMode = this.plugin.settings.settingsLayoutMode;
        containerEl.toggleClass('is-tabs-layout', layoutMode === 'tabs');
        containerEl.toggleClass('is-accordion-layout', layoutMode === 'accordion');

        const layoutEl = containerEl.createDiv({
            cls: `lorebase-settings-layout is-${layoutMode}`,
        });
        const contentEl = layoutEl.createDiv({ cls: 'lorebase-settings-content' });

        const context = this.getSectionContext();
        const sections = this.getSectionDefinitions(context);
        if (layoutMode === 'accordion') {
            this.renderAccordionSections(contentEl, sections);
        } else {
            this.renderTabbedSections(contentEl, sections);
        }

        this.restoreScrollState(scrollState);
    }

    hide(): void {
        this.openAccordionSections.clear();
        void this.plugin.saveSettings();
        super.hide();
    }

    private getSectionDefinitions(context: SettingsSectionContext): SettingsSectionDefinition[] {
        return [
            { id: 'general', label: t('settingsGeneral'), description: t('settingsSectionGeneralDesc'), icon: ICON_GENERAL, render: (container) => renderGeneralSettings(context, container) },
            { id: 'customization', label: t('settingsBadges'), description: t('settingsSectionCustomizationDesc'), icon: ICON_CARD_CUSTOMIZATION, render: (container) => renderCardCustomizationSettings(context, container) },
            { id: 'media', label: t('settingsMedia'), description: t('settingsSectionMediaDesc'), icon: ICON_MEDIA, render: (container) => renderMediaSettings(context, container) },
            { id: 'integrations', label: t('settingsIntegrations'), description: t('settingsSectionIntegrationsDesc'), icon: ICON_INTEGRATIONS, render: (container) => renderIntegrationsSection(context, container) },
            { id: 'import', label: getImportSectionLabel(this.plugin.settings.language), description: getImportSectionDesc(this.plugin.settings.language), icon: String.fromCodePoint(0x1F4E6), render: (container) => renderImportSection(context, container) },
            { id: 'about', label: t('settingsAbout'), description: t('settingsSectionAboutDesc'), icon: String.fromCodePoint(0x1F9E9), render: (container) => renderAboutSection(context, container) },
        ];
    }

    private renderLayoutModeToggle(container: HTMLElement): void {
        const control = container.createDiv({
            cls: 'lorebase-settings-layout-toggle',
            attr: {
                role: 'group',
                'aria-label': t('settingsLayoutMode'),
            },
        });
        const modes: Array<{ mode: SettingsLayoutMode; icon: string; label: string }> = [
            { mode: 'tabs', icon: 'layout-grid', label: t('settingsLayoutTabs') },
            { mode: 'accordion', icon: 'list', label: t('settingsLayoutAccordion') },
        ];

        for (const option of modes) {
            const active = this.plugin.settings.settingsLayoutMode === option.mode;
            const button = control.createEl('button', {
                cls: `lorebase-settings-layout-toggle-button ${active ? 'is-active' : ''}`,
                attr: {
                    type: 'button',
                    title: option.label,
                    'aria-label': option.label,
                    'aria-pressed': String(active),
                },
            });
            setIcon(button, option.icon);
            button.addEventListener('click', () => {
                if (this.plugin.settings.settingsLayoutMode === option.mode) return;
                this.plugin.settings.settingsLayoutMode = option.mode;
                if (option.mode === 'accordion') this.openAccordionSections.clear();
                void this.plugin.saveSettings();
                this.display();
            });
        }
    }

    private renderTabbedSections(
        container: HTMLElement,
        sections: SettingsSectionDefinition[]
    ): void {
        if (!sections.some((section) => section.id === this.activeSettingsSection)) {
            this.activeSettingsSection = sections[0].id;
        }

        const tabs = container.createDiv({
            cls: 'lorebase-settings-section-tabs',
            attr: {
                role: 'tablist',
                'aria-label': t('settingsLayoutTabs'),
            },
        });
        const panels = container.createDiv({ cls: 'lorebase-settings-section-panels' });
        const buttons = new Map<SettingsSectionId, HTMLButtonElement>();
        const panelMap = new Map<SettingsSectionId, HTMLElement>();

        for (const section of sections) {
            const panelId = `lorebase-settings-panel-${section.id}`;
            const panel = panels.createDiv({
                cls: 'lorebase-settings-section-panel',
                attr: {
                    id: panelId,
                    role: 'tabpanel',
                },
            });
            panelMap.set(section.id, panel);
            section.render(panel);

            const button = tabs.createEl('button', {
                cls: 'lorebase-settings-section-tab',
                attr: {
                    type: 'button',
                    role: 'tab',
                    'aria-controls': panelId,
                },
            });
            const icon = button.createSpan({ cls: 'lorebase-settings-section-tab-icon' });
            this.renderSectionIcon(icon, section.icon);
            icon.setAttribute('aria-hidden', 'true');
            button.createSpan({ cls: 'lorebase-settings-section-tab-label', text: section.label });
            buttons.set(section.id, button);
        }

        const selectSection = (
            id: SettingsSectionId,
            focus = false,
            resetScroll = false
        ): void => {
            this.activeSettingsSection = id;
            buttons.forEach((button, key) => {
                const active = key === id;
                button.toggleClass('is-active', active);
                button.setAttribute('aria-selected', String(active));
                button.tabIndex = active ? 0 : -1;
            });
            panelMap.forEach((panel, key) => {
                const active = key === id;
                panel.toggleClass('is-active', active);
                panel.toggleAttribute('hidden', !active);
            });
            if (resetScroll) {
                const scrollHost = this.findScrollHost();
                scrollHost.scrollTop = 0;
            }
            if (focus) buttons.get(id)?.focus();
        };

        sections.forEach((section, index) => {
            const button = buttons.get(section.id);
            if (!button) return;
            button.addEventListener('click', () => selectSection(section.id, false, true));
            button.addEventListener('keydown', (event) => {
                let nextIndex = index;
                if (event.key === 'ArrowRight') nextIndex = (index + 1) % sections.length;
                else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + sections.length) % sections.length;
                else if (event.key === 'Home') nextIndex = 0;
                else if (event.key === 'End') nextIndex = sections.length - 1;
                else return;
                event.preventDefault();
                selectSection(sections[nextIndex].id, true, true);
            });
        });

        selectSection(this.activeSettingsSection);
    }

    private renderAccordionSections(
        container: HTMLElement,
        sections: SettingsSectionDefinition[]
    ): void {
        const list = container.createDiv({ cls: 'lorebase-settings-accordion-list' });
        for (const section of sections) {
            const details = list.createEl('details', {
                cls: `lorebase-settings-accordion-section is-${section.id}`,
            });
            if (this.openAccordionSections.has(section.id)) details.open = true;
            const summary = details.createEl('summary', {
                cls: 'lorebase-settings-accordion-summary',
            });
            const icon = summary.createSpan({
                cls: 'lorebase-settings-accordion-icon',
                attr: { 'aria-hidden': 'true' },
            });
            this.renderSectionIcon(icon, section.icon);
            const text = summary.createDiv({ cls: 'lorebase-settings-accordion-text' });
            text.createDiv({
                cls: 'lorebase-settings-accordion-title',
                text: section.label,
            });
            text.createDiv({
                cls: 'lorebase-settings-accordion-description',
                text: section.description,
            });
            const caret = summary.createSpan({ cls: 'lorebase-settings-accordion-caret' });
            setIcon(caret, 'chevron-right');

            const body = details.createDiv({ cls: 'lorebase-settings-accordion-body' });
            section.render(body);
            details.addEventListener('toggle', () => {
                if (details.open) this.openAccordionSections.add(section.id);
                else this.openAccordionSections.delete(section.id);
            });
        }
    }

    private getSectionContext(): SettingsSectionContext {
        return {
            app: this.app,
            plugin: this.plugin,
            display: () => this.refreshSettings(),
            createSectionHeader: (container, icon, text) => this.createSectionHeader(container, icon, text),
            createCollapsibleGroup: (container, title, description, open) => this.createCollapsibleGroup(container, title, description, open),
            getActiveMediaTab: (scope) => this.activeMediaTabs[scope],
            setActiveMediaTab: (scope, media) => {
                this.activeMediaTabs[scope] = media;
            },
            applyAccentColor: (color) => this.applyAccentColor(color),
        };
    }

    private refreshSettings(): void {
        const declarativeHost = this as LorebaseSettingTab & DeclarativeSettingsHost;
        if (typeof declarativeHost.update === 'function') {
            declarativeHost.update();
            return;
        }
        this.display();
    }

    private applyAccentColor(color: string): void {
        activeDocument.documentElement.style.setProperty('--lorebase-accent', color);
    }

    private renderSupportBlock(container: HTMLElement): void {
        const block = container.createDiv({ cls: 'lorebase-settings-support' });
        const actions = block.createDiv({ cls: 'lorebase-settings-support-actions' });
        const links = [
            {
                label: 'Ko-fi',
                brand: 'kofi',
                url: 'https://ko-fi.com/murch1k',
            },
            {
                label: 'Discord',
                brand: 'discord',
                url: 'https://discord.gg/eTcw8v8c4',
            },
            {
                label: 'Patreon',
                brand: 'patreon',
                url: 'https://www.patreon.com/c/Murch1k',
            },
        ];

        for (const link of links) {
            const button = actions.createEl('button', {
                cls: `lorebase-settings-support-button is-${link.brand}`,
                attr: {
                    type: 'button',
                    title: link.url,
                    'aria-label': link.label,
                },
            });
            const icon = button.createSpan({ cls: 'lorebase-settings-support-icon' });
            icon.appendChild(this.createSupportIcon(link.brand));
            button.createSpan({ text: link.label });
            button.addEventListener('click', (event) => {
                event.preventDefault();
                window.open(link.url, '_blank', 'noopener');
            });
        }

        const text = block.createDiv({ cls: 'lorebase-settings-support-text' });
        text.createDiv({ cls: 'lorebase-settings-support-title', text: t('settingsSupportTitle') });
        text.createDiv({ cls: 'lorebase-settings-support-desc', text: t('settingsSupportDesc') });
    }

    private createSectionHeader(container: HTMLElement, icon: string, text: string): void {
        const heading = new Setting(container)
            .setHeading();
        heading.settingEl.addClass('lorebase-settings-section-title');
        heading.nameEl.empty();
        const iconElement = heading.nameEl.createSpan({ cls: 'lorebase-settings-section-icon' });
        this.renderSectionIcon(iconElement, icon);
        heading.nameEl.createSpan({ text });
    }

    private renderSectionIcon(container: HTMLElement, icon: string): void {
        if (icon.startsWith('lucide:')) {
            setIcon(container, icon.slice('lucide:'.length));
            return;
        }
        container.setText(icon);
    }

    private createSupportIcon(brand: string): SVGElement {
        const svg = createSvg('svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');

        const addPath = (d: string, className?: string): void => {
            const path = svg.createSvg('path');
            path.setAttribute('d', d);
            if (className) path.setAttribute('class', className);
            svg.appendChild(path);
        };
        const addCircle = (cx: string, cy: string, r: string): void => {
            const circle = svg.createSvg('circle');
            circle.setAttribute('cx', cx);
            circle.setAttribute('cy', cy);
            circle.setAttribute('r', r);
            svg.appendChild(circle);
        };

        if (brand === 'kofi') {
            addPath('M4.5 7.5h11.8v6.1a4.9 4.9 0 0 1-4.9 4.9H9.4a4.9 4.9 0 0 1-4.9-4.9V7.5Z', 'cup');
            addPath('M16.3 10h1.5a2.55 2.55 0 0 1 0 5.1h-1.5', 'handle');
            addPath('M10.4 14.9 7.9 12.5a1.55 1.55 0 0 1 2.19-2.19l.31.31.31-.31a1.55 1.55 0 0 1 2.19 2.19l-2.5 2.4Z', 'heart');
            return svg;
        }

        if (brand === 'discord') {
            addPath('M7.25 7.75A12.2 12.2 0 0 1 10 6.9l.35.7a10.7 10.7 0 0 1 3.3 0l.35-.7a12.2 12.2 0 0 1 2.75.85c1.7 2.5 2.2 4.9 2 7.35a10.5 10.5 0 0 1-3.42 1.76l-.82-1.08c.45-.16.88-.36 1.3-.6a7.9 7.9 0 0 1-7.62 0c.42.24.85.44 1.3.6l-.82 1.08a10.5 10.5 0 0 1-3.42-1.76c-.3-2.74.47-5.16 2-7.35Z');
            addCircle('10', '12.55', '1');
            addCircle('14', '12.55', '1');
            return svg;
        }

        addCircle('14.7', '8.9', '5.1');
        addPath('M5.4 4.2h3.4v15.6H5.4z');
        return svg;
    }

    private createCollapsibleGroup(
        container: HTMLElement,
        title: string,
        description?: string,
        open: boolean = true
    ): CollapsibleGroupElements {
        const details = container.createEl('details', { cls: 'lorebase-settings-group' });
        if (open) {
            details.setAttr('open', '');
        }
        const summary = details.createEl('summary', { cls: 'lorebase-settings-group-summary' });
        const textBlock = summary.createDiv({ cls: 'lorebase-settings-group-text' });
        textBlock.createDiv({ cls: 'lorebase-settings-group-title', text: title });
        if (description) {
            textBlock.createDiv({ cls: 'lorebase-settings-group-desc', text: description });
        }
        const body = details.createDiv({ cls: 'lorebase-settings-group-body' });
        return { root: details, body };
    }

    private captureScrollState(): { host: HTMLElement; top: number } {
        const host = this.findScrollHost();
        return { host, top: host.scrollTop };
    }

    private restoreScrollState(state: { host: HTMLElement; top: number }): void {
        // Wait a frame so the new settings DOM is fully measured before restoring.
        window.requestAnimationFrame(() => {
            state.host.scrollTop = state.top;
        });
    }

    private findScrollHost(): HTMLElement {
        let current: HTMLElement | null = this.containerEl;
        while (current) {
            const style = window.getComputedStyle(current);
            const canScroll = (style.overflowY === 'auto' || style.overflowY === 'scroll')
                && current.scrollHeight > current.clientHeight;
            if (canScroll) return current;
            current = current.parentElement;
        }
        return this.containerEl;
    }

}
