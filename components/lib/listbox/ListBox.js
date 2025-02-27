import * as React from 'react';
import { FilterService } from '../api/Api';
import { Tooltip } from '../tooltip/Tooltip';
import { classNames, ObjectUtils } from '../utils/Utils';
import { VirtualScroller } from '../virtualscroller/VirtualScroller';
import { ListBoxHeader } from './ListBoxHeader';
import { ListBoxItem } from './ListBoxItem';

export const ListBox = React.memo(React.forwardRef((props, ref) => {
    const [filterValueState, setFilterValueState] = React.useState('');
    const elementRef = React.useRef(null);
    const virtualScrollerRef = React.useRef(null);
    const optionTouched = React.useRef(false);
    const filteredValue = (props.onFilterValueChange ? props.filterValue : filterValueState) || '';
    const hasFilter = filteredValue && filteredValue.trim().length > 0;

    const onOptionSelect = (event) => {
        const option = event.option;
        if (props.disabled || isOptionDisabled(option)) {
            return;
        }

        props.multiple ? onOptionSelectMultiple(event.originalEvent, option) : onOptionSelectSingle(event.originalEvent, option);
        optionTouched.current = false;
    }

    const onOptionTouchEnd = () => {
        if (props.disabled) {
            return;
        }

        optionTouched.current = true;
    }

    const onOptionSelectSingle = (event, option) => {
        let selected = isSelected(option);
        let valueChanged = false;
        let value = null;
        let metaSelection = optionTouched.current ? false : props.metaKeySelection;

        if (metaSelection) {
            let metaKey = (event.metaKey || event.ctrlKey);

            if (selected) {
                if (metaKey) {
                    value = null;
                    valueChanged = true;
                }
            }
            else {
                value = getOptionValue(option);
                valueChanged = true;
            }
        }
        else {
            value = selected ? null : getOptionValue(option);
            valueChanged = true;
        }

        if (valueChanged) {
            updateModel(event, value);
        }
    }

    const onOptionSelectMultiple = (event, option) => {
        let selected = isSelected(option);
        let valueChanged = false;
        let value = null;
        let metaSelection = optionTouched ? false : props.metaKeySelection;

        if (metaSelection) {
            let metaKey = (event.metaKey || event.ctrlKey);

            if (selected) {
                if (metaKey)
                    value = removeOption(option);
                else
                    value = [getOptionValue(option)];

                valueChanged = true;
            }
            else {
                value = (metaKey) ? props.value || [] : [];
                value = [...value, getOptionValue(option)];
                valueChanged = true;
            }
        }
        else {
            if (selected)
                value = removeOption(option);
            else
                value = [...props.value || [], getOptionValue(option)];

            valueChanged = true;
        }

        if (valueChanged) {
            props.onChange({
                originalEvent: event,
                value,
                stopPropagation: () => { },
                preventDefault: () => { },
                target: {
                    name: props.name,
                    id: props.id,
                    value
                }
            });
        }
    }

    const onFilter = (event) => {
        const { originalEvent, value } = event;
        if (props.onFilterValueChange) {
            props.onFilterValueChange({
                originalEvent,
                value
            });
        }
        else {
            setFilterValueState(value);
        }
    }

    const updateModel = (event, value) => {
        if (props.onChange) {
            props.onChange({
                originalEvent: event,
                value,
                stopPropagation: () => { },
                preventDefault: () => { },
                target: {
                    name: props.name,
                    id: props.id,
                    value
                }
            });
        }
    }

    const removeOption = (option) => {
        return props.value.filter(val => !ObjectUtils.equals(val, getOptionValue(option), props.dataKey));
    }

    const isSelected = (option) => {
        let optionValue = getOptionValue(option);
        return props.multiple && props.value ? props.value.some((val) => ObjectUtils.equals(val, optionValue, props.dataKey)) : ObjectUtils.equals(props.value, optionValue, props.dataKey);
    }

    const filter = (option) => {
        const filterValue = filteredValue.trim().toLocaleLowerCase(props.filterLocale);
        const optionLabel = getOptionLabel(option).toLocaleLowerCase(props.filterLocale);

        return optionLabel.indexOf(filterValue) > -1;
    }

    const getOptionLabel = (option) => {
        return props.optionLabel ? ObjectUtils.resolveFieldData(option, props.optionLabel) : (option && option['label'] !== undefined ? option['label'] : option);
    }

    const getOptionValue = (option) => {
        return props.optionValue ? ObjectUtils.resolveFieldData(option, props.optionValue) : (option && option['value'] !== undefined ? option['value'] : option);
    }

    const getOptionRenderKey = (option) => {
        return props.dataKey ? ObjectUtils.resolveFieldData(option, props.dataKey) : getOptionLabel(option);
    }

    const isOptionDisabled = (option) => {
        if (props.optionDisabled) {
            return ObjectUtils.isFunction(props.optionDisabled) ? props.optionDisabled(option) : ObjectUtils.resolveFieldData(option, props.optionDisabled);
        }

        return (option && option['disabled'] !== undefined ? option['disabled'] : false);
    }

    const getOptionGroupRenderKey = (optionGroup) => {
        return ObjectUtils.resolveFieldData(optionGroup, props.optionGroupLabel);
    }

    const getOptionGroupLabel = (optionGroup) => {
        return ObjectUtils.resolveFieldData(optionGroup, props.optionGroupLabel);
    }

    const getOptionGroupChildren = (optionGroup) => {
        return ObjectUtils.resolveFieldData(optionGroup, props.optionGroupChildren);
    }

    const getVisibleOptions = () => {
        if (hasFilter) {
            const filterValue = filteredValue.trim().toLocaleLowerCase(props.filterLocale);
            const searchFields = props.filterBy ? props.filterBy.split(',') : [props.optionLabel || 'label'];

            if (props.optionGroupLabel) {
                let filteredGroups = [];
                for (let optgroup of props.options) {
                    let filteredSubOptions = FilterService.filter(getOptionGroupChildren(optgroup), searchFields, filterValue, props.filterMatchMode, props.filterLocale);
                    if (filteredSubOptions && filteredSubOptions.length) {
                        filteredGroups.push({ ...optgroup, ...{ items: filteredSubOptions } });
                    }
                }
                return filteredGroups;
            }
            else {
                return FilterService.filter(props.options, searchFields, filterValue, props.filterMatchMode, props.filterLocale);
            }
        }
        else {
            return props.options;
        }
    }

    const createHeader = () => {
        return props.filter ? <ListBoxHeader filter={filteredValue} onFilter={onFilter} disabled={props.disabled} filterPlaceholder={props.filterPlaceholder} /> : null;
    }

    const createGroupChildren = (optionGroup) => {
        const groupChildren = getOptionGroupChildren(optionGroup);

        return (
            groupChildren.map((option, j) => {
                const optionLabel = getOptionLabel(option);
                const optionKey = j + '_' + getOptionRenderKey(option);
                const disabled = isOptionDisabled(option)
                const tabIndex = disabled ? null : props.tabIndex || 0;

                return (
                    <ListBoxItem key={optionKey} label={optionLabel} option={option} template={props.itemTemplate} selected={isSelected(option)}
                        onClick={onOptionSelect} onTouchEnd={onOptionTouchEnd} tabIndex={tabIndex} disabled={disabled} />
                )
            })
        )
    }

    const createItem = (option, index) => {
        if (props.optionGroupLabel) {
            const groupContent = props.optionGroupTemplate ? ObjectUtils.getJSXElement(props.optionGroupTemplate, option, index) : getOptionGroupLabel(option);
            const groupChildrenContent = createGroupChildren(option);
            const key = index + '_' + getOptionGroupRenderKey(option);

            return (
                <React.Fragment key={key}>
                    <li className="p-listbox-item-group">
                        {groupContent}
                    </li>
                    {groupChildrenContent}
                </React.Fragment>
            )
        }
        else {
            const optionLabel = getOptionLabel(option);
            const optionKey = index + '_' + getOptionRenderKey(option);
            const disabled = isOptionDisabled(option)
            const tabIndex = disabled ? null : props.tabIndex || 0;

            return (
                <ListBoxItem key={optionKey} label={optionLabel} option={option} template={props.itemTemplate} selected={isSelected(option)}
                    onClick={onOptionSelect} onTouchEnd={onOptionTouchEnd} tabIndex={tabIndex} disabled={disabled} />
            )
        }
    }

    const createItems = () => {
        return visibleOptions ? visibleOptions.map(createItem) : null;
    }

    const createList = () => {
        if (props.virtualScrollerOptions) {
            const virtualScrollerProps = {
                ...props.virtualScrollerOptions, ...{
                    items: visibleOptions,
                    onLazyLoad: (event) => props.virtualScrollerOptions.onLazyLoad({ ...event, ...{ filter: visibleOptions } }),
                    itemTemplate: (item, option) => item && createItem(item, option.index),
                    contentTemplate: (option) => {
                        const className = classNames('p-listbox-list', option.className);

                        return (
                            <ul ref={option.contentRef} className={className} role="listbox" aria-multiselectable={props.multiple}>
                                {option.children}
                            </ul>
                        )
                    }
                }
            };

            return <VirtualScroller ref={virtualScrollerRef} {...virtualScrollerProps} />
        }
        else {
            const items = createItems();

            return (
                <ul className="p-listbox-list" role="listbox" aria-multiselectable={props.multiple}>
                    {items}
                </ul>
            )
        }
    }

    const visibleOptions = getVisibleOptions();

    const hasTooltip = ObjectUtils.isNotEmpty(props.tooltip);
    const otherProps = ObjectUtils.findDiffKeys(props, ListBox.defaultProps);
    const className = classNames('p-listbox p-component', {
        'p-disabled': props.disabled
    }, props.className);
    const listClassName = classNames('p-listbox-list-wrapper', props.listClassName);
    const list = createList();
    const header = createHeader();

    return (
        <>
            <div ref={elementRef} id={props.id} className={className} style={props.style} {...otherProps}>
                {header}
                <div className={listClassName} style={props.listStyle}>
                    {list}
                </div>
            </div>
            {hasTooltip && <Tooltip target={elementRef} content={props.tooltip} {...props.tooltipOptions} />}
        </>
    )
}));

ListBox.displayName = 'ListBox';
ListBox.defaultProps = {
    __TYPE: 'ListBox',
    id: null,
    value: null,
    options: null,
    optionLabel: null,
    optionValue: null,
    optionDisabled: null,
    optionGroupLabel: null,
    optionGroupChildren: null,
    optionGroupTemplate: null,
    itemTemplate: null,
    style: null,
    listStyle: null,
    listClassName: null,
    className: null,
    virtualScrollerOptions: null,
    disabled: null,
    dataKey: null,
    multiple: false,
    metaKeySelection: false,
    filter: false,
    filterBy: null,
    filterValue: null,
    filterMatchMode: 'contains',
    filterPlaceholder: null,
    filterLocale: undefined,
    tabIndex: 0,
    tooltip: null,
    tooltipOptions: null,
    ariaLabelledBy: null,
    onChange: null,
    onFilterValueChange: null
}
