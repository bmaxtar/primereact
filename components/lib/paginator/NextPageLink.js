import * as React from 'react';
import { Ripple } from '../ripple/Ripple';
import { classNames, ObjectUtils } from '../utils/Utils';

export const NextPageLink = React.memo((props) => {
    const className = classNames('p-paginator-next p-paginator-element p-link', { 'p-disabled': props.disabled });
    const iconClassName = 'p-paginator-icon pi pi-angle-right';
    const element = (
        <button type="button" className={className} onClick={props.onClick} disabled={props.disabled}>
            <span className={iconClassName}></span>
            <Ripple />
        </button>
    );

    if (props.template) {
        const defaultOptions = {
            onClick: props.onClick,
            className,
            iconClassName,
            disabled: props.disabled,
            element,
            props
        };

        return ObjectUtils.getJSXElement(props.template, defaultOptions);
    }

    return element;
});

NextPageLink.displayName = 'NextPageLink';
NextPageLink.defaultProps = {
    __TYPE: 'NextPageLink',
    disabled: false,
    onClick: null,
    template: null
}
