import PropTypes from 'prop-types';
import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
} from 'react';
import { withStyles } from '@mui/styles';

import {
    Accordion, AccordionDetails, AccordionSummary,
    Checkbox, Divider, Button, IconButton,
    Tooltip,
} from '@mui/material';

import {
    ArrowDownward,
    ArrowUpward,
    ExpandMore as ExpandMoreIcon,
    Lock as LockIcon,
    FilterAlt as FilterAltIcon,
    Colorize as ColorizeIcon,
    Code as CodeIcon,
    Info as InfoIcon,
    Delete,
    Add,
} from '@mui/icons-material';

import { I18n, Utils } from '@iobroker/adapter-react-v5';

import WidgetField from './WidgetField';
import IODialog from '../../Components/IODialog';
import { getWidgetTypes, parseAttributes } from '../../Vis/visWidgetsCatalog';
import WidgetCSS from './WidgetCSS';
import WidgetJS from './WidgetJS';

const ICONS = {
    'group.fixed': <FilterAltIcon fontSize="small" />,
    locked: <LockIcon fontSize="small" />,
};

const styles = theme => ({
    backgroundClass: {
        display: 'flex',
        alignItems: 'center',
    },
    backgroundClassSquare: {
        width: 40,
        height: 40,
        display: 'inline-block',
        marginRight: 4,
    },
    clearPadding: {
        '&&&&': {
            padding: 0,
            margin: 0,
            minHeight: 'initial',
        },
    },
    checkBox: {
        marginTop: '-4px !important',
    },
    emptyMoreIcon: {
        width: 24,
        height: 24,
    },
    fieldTitle: {
        width: 140,
        fontSize: '80%',
        position: 'relative',
        lineHeight: '21px',
    },
    fieldTitleDisabled: {
        opacity: 0.8,
    },
    fieldTitleError: {
        color: theme.palette.error.main,
    },
    colorize: {
        display: 'none',
        position: 'absolute',
        right: 0,
        cursor: 'pointer',
        opacity: 0.3,
        '&:hover': {
            opacity: 1,
        },
        '&:active': {
            transform: 'scale(0.8)',
        },
    },
    fieldRow: {
        '&:hover $colorize': {
            display: 'initial',
        },
    },
    groupButton: {
        width: 24,
        height: 24,
    },
    grow: {
        flexGrow: 1,
    },
    fieldContent: {
        '&&&&&&': {
            fontSize: '80%',
        },
        '& svg': {
            fontSize: '1rem',
        },
    },
    fieldInput: {
        width: '100%',
    },
    fieldContentColor: {
        '&&&&&& label': {
            display: 'none',
        },
        '&&&&&& input': {
            fontSize: '80%',
        },
    },
    fieldContentSlider: {
        display: 'inline',
        width: 'calc(100% - 50px)',
        marginRight: 8,
    },
    fieldContentSliderInput: {
        display: 'inline',
        width: 50,
    },
    groupSummary: {
        '&&&&&&': {
            marginTop: 20,
            borderRadius: '4px',
            padding: '2px',
        },
    },
    groupSummaryExpanded: {
        '&&&&&&': {
            marginTop: 20,
            borderTopRightRadius: '4px',
            borderTopLeftRadius: '4px',
            padding: '2px',
        },
    },
    lightedPanel: theme.classes.lightedPanel,
    infoIcon: {
        width: 16,
        verticalAlign: 'middle',
        marginLeft: 3,
    },
    smallImageDiv: {
        width: 30,
        height: 30,
        display: 'inline-block',
        float: 'right',
    },
    smallImage: {
        maxWidth: '100%',
        maxHeight: '100%',
    },
    widgetIcon: {
        overflow: 'hidden',
        width: 40,
        height: 40,
        display: 'inline-block',
        marginRight: 4,
    },
    icon: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    widgetImage: {
        display: 'block',
        width: 30,
        height: 30,
        transformOrigin: '0 0',
    },
    iconFolder: {
        verticalAlign: 'middle',
        marginRight: 6,
        marginTop: -3,
        fontSize: 20,
        color: '#00dc00',
    },
    listFolder: {
        backgroundColor: 'inherit',
        lineHeight: '36px',
    },
    coloredWidgetSet: {
        padding: '0 3px',
        borderRadius: 3,
    },
    widgetName: {
        verticalAlign: 'top',
        display: 'inline-block',
    },
    widgetType: {
        verticalAlign: 'top',
        display: 'inline-block',
        fontSize: 12,
        fontStyle: 'italic',
        marginLeft: 8,
    },
    widgetNameText: {
        lineHeight: '20px',
    },
    fieldHelp: {
        fontSize: 12,
        fontStyle: 'italic',
        paddingLeft: 16,
        color: theme.palette.mode === 'dark' ? '#00931a' : '#014807',
    },
});

const getFieldsBefore = () => [
    {
        name: 'fixed',
        fields: [
            { name: 'name' },
            { name: 'comment' },
            { name: 'class', type: 'class' },
            { name: 'filterkey', type: 'filters' },
            { name: 'multi-views', type: 'select-views' },
            { name: 'locked', type: 'checkbox' },
        ],
    },
    {
        name: 'visibility',
        fields: [{ name: 'visibility-oid', type: 'id' },
            {
                name: 'visibility-cond', type: 'select', options: ['==', '!=', '<=', '>=', '<', '>', 'consist', 'not consist', 'exist', 'not exist'], default: '==',
            },
            { name: 'visibility-val', default: 1 },
            { name: 'visibility-groups', type: 'groups' },
            {
                name: 'visibility-groups-action', type: 'select', options: ['hide', 'disabled'], default: 'hide',
            }],
    },
];

const getSignals = (count, adapterName) => {
    const result = {
        name: 'signals',
        fields: [
            {
                name: 'signals-count',
                type: 'select',
                options: ['1', '2', '3'],
                default: '1',
                immediateChange: true,
            },
        ],
    };
    for (let i = 0; i < count; i++) {
        result.fields = result.fields.concat([
            { name: `signals-oid-${i}`, type: 'id' },
            {
                name: `signals-cond-${i}`,
                type: 'select',
                options: ['==', '!=', '<=', '>=', '<', '>', 'consist', 'not consist', 'exist', 'not exist'],
                default: '==',
            },
            { name: `signals-val-${i}`, default: true },
            { name: `signals-icon-${i}`, type: 'image', default: `${adapterName}/signals/lowbattery.png` },
            {
                name: `signals-icon-size-${i}`, type: 'slider', options: { min: 1, max: 120, step: 1 }, default: 0,
            },
            { name: `signals-icon-style-${i}` },
            { name: `signals-text-${i}` },
            { name: `signals-text-style-${i}` },
            { name: `signals-text-class-${i}` },
            { name: `signals-blink-${i}`, type: 'checkbox', default: false },
            {
                name: `signals-horz-${i}`, type: 'slider', options: { min: -20, max: 120, step: 1 }, default: 0,
            },
            {
                name: `signals-vert-${i}`, type: 'slider', options: { min: -20, max: 120, step: 1 }, default: 0,
            },
            { name: `signals-hide-edit-${i}`, type: 'checkbox', default: false },
            { type: 'delimiter' },
        ]);
    }

    return result;
};

const getFieldsAfter = (widget, widgets, fonts) => [
    {
        name: 'css_common',
        isStyle: true,
        fields: [
            { name: 'position', type: 'nselect', options: ['', 'relative', 'sticky'] },
            { name: 'display', type: 'nselect', options: ['', 'inline-block'] },
            ...(['relative', 'sticky'].includes(widget.style.position) ? [] :
                [
                    { name: 'left', type: 'dimension' },
                    { name: 'top', type: 'dimension' },
                ]),
            { name: 'width', type: 'dimension' },
            { name: 'height', type: 'dimension' },
            {
                name: 'z-index', type: 'number', min: -200, max: 200,
            },
            { name: 'overflow-x', type: 'nselect', options: ['', 'visible', 'hidden', 'scroll', 'auto', 'initial', 'inherit'] },
            { name: 'overflow-y', type: 'nselect', options: ['', 'visible', 'hidden', 'scroll', 'auto', 'initial', 'inherit'] },
            { name: 'opacity' },
            { name: 'cursor', type: 'auto' },
            { name: 'transform' },
        ],
    },
    {
        name: 'css_font_text',
        isStyle: true,
        fields: [{ name: 'color', type: 'color' },
            { name: 'text-align', type: 'nselect', options: ['', 'left', 'right', 'center', 'justify', 'initial', 'inherit'] },
            { name: 'text-shadow' },
            {
                name: 'font-family',
                type: 'auto',
                options: fonts,
            },
            { name: 'font-style', type: 'nselect', options: ['', 'normal', 'italic', 'oblique', 'initial', 'inherit'] },
            { name: 'font-variant', type: 'nselect', options: ['', 'normal', 'small-caps', 'initial', 'inherit'] },
            { name: 'font-weight', type: 'auto', options: ['normal', 'bold', 'bolder', 'lighter', 'initial', 'inherit'] },
            { name: 'font-size', type: 'auto', options: ['medium', 'xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large', 'smaller', 'larger', 'initial', 'inherit'] },
            { name: 'line-height' },
            { name: 'letter-spacing' },
            { name: 'word-spacing' }],
    },
    {
        name: 'css_background',
        isStyle: true,
        fields: [{ name: 'background' },
            { name: 'background-color', type: 'color' },
            { name: 'background-image' },
            { name: 'background-repeat', type: 'nselect', options: ['', 'repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'initial', 'inherit'] },
            { name: 'background-attachment', type: 'nselect', options: ['', 'scroll', 'fixed', 'local', 'initial', 'inherit'] },
            { name: 'background-position' },
            { name: 'background-size' },
            { name: 'background-clip', type: 'nselect', options: ['', 'border-box', 'padding-box', 'content-box', 'initial', 'inherit'] },
            { name: 'background-origin', type: 'nselect', options: ['', 'padding-box', 'border-box', 'content-box', 'initial', 'inherit'] }],
    },
    {
        name: 'css_border',
        isStyle: true,
        fields: [
            { name: 'box-sizing', type: 'nselect', options: ['', 'border-box', 'content-box']  },
            { name: 'border-width' },
            { name: 'border-style', type: 'nselect', options: ['', 'none', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'hidden'] },
            { name: 'border-color', type: 'color' },
            { name: 'border-radius' }],
    },
    {
        name: 'css_shadow_padding',
        isStyle: true,
        fields: [{ name: 'padding' },
            { name: 'padding-left' },
            { name: 'padding-top' },
            { name: 'padding-right' },
            { name: 'padding-bottom' },
            { name: 'box-shadow' },
            { name: 'margin-left' },
            { name: 'margin-top' },
            { name: 'margin-right' },
            { name: 'margin-bottom' }],
    },
    {
        name: 'gestures',
        fields: [
            {
                name: 'gestures-indicator',
                type: 'auto',
                options: Object.keys(widgets).filter(wid => widgets[wid].tpl === 'tplValueGesture'),
            },
            { name: 'gestures-offsetX', default: 0, type: 'number' },
            { name: 'gestures-offsetY', default: 0, type: 'number' },
            { type: 'delimiter' },
            ...(['swiping', 'rotating', 'pinching'].flatMap(gesture => [
                { name: `gestures-${gesture}-oid`,        type: 'id' },
                { name: `gestures-${gesture}-value`,      default: '' },
                { name: `gestures-${gesture}-minimum`,    type: 'number' },
                { name: `gestures-${gesture}-maximum`,    type: 'number' },
                { name: `gestures-${gesture}-delta`,      type: 'number' },
                { type: 'delimiter' },
            ])),
            ...(['swipeRight', 'swipeLeft', 'swipeUp', 'swipeDown', 'rotateLeft', 'rotateRight', 'pinchIn', 'pinchOut'].flatMap(gesture => [
                { name: `gestures-${gesture}-oid`,    type: 'id' },
                { name: `gestures-${gesture}-value`,  default: '' },
                { name: `gestures-${gesture}-limit`,  type: 'number' },
                { type: 'delimiter' },
            ])),
        ],
    },
    {
        name: 'last_change',
        fields: [
            { name: 'lc-oid', type: 'id' },
            {
                name: 'lc-type', type: 'select', options: ['last-change', 'timestamp'], default: 'last-change',
            },
            { name: 'lc-is-interval', type: 'checkbox', default: true },
            { name: 'lc-is-moment', type: 'checkbox', default: false },
            {
                name: 'lc-format', type: 'auto', options: ['YYYY.MM.DD hh:mm:ss', 'DD.MM.YYYY hh:mm:ss', 'YYYY.MM.DD', 'DD.MM.YYYY', 'YYYY/MM/DD hh:mm:ss', 'YYYY/MM/DD', 'hh:mm:ss'], default: '',
            },
            {
                name: 'lc-position-vert', type: 'select', options: ['top', 'middle', 'bottom'], default: 'top',
            },
            {
                name: 'lc-position-horz', type: 'select', options: ['left', /* 'middle', */'right'], default: 'right',
            },
            {
                name: 'lc-offset-vert', type: 'slider', options: { min: -120, max: 120, step: 1 }, default: 0,
            },
            {
                name: 'lc-offset-horz', type: 'slider', options: { min: -120, max: 120, step: 1 }, default: 0,
            },
            {
                name: 'lc-font-size', type: 'auto', options: ['', 'medium', 'xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large', 'smaller', 'larger', 'initial', 'inherit'], default: '12px',
            },
            { name: 'lc-font-family', type: 'fontname', default: '' },
            {
                name: 'lc-font-style', type: 'auto', options: ['', 'normal', 'italic', 'oblique', 'initial', 'inherit'], default: '',
            },
            { name: 'lc-bkg-color', type: 'color', default: '' },
            { name: 'lc-color', type: 'color', default: '' },
            { name: 'lc-border-width', default: '0' },
            {
                name: 'lc-border-style', type: 'auto', options: ['', 'none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset', 'initial', 'inherit'], default: '',
            },
            { name: 'lc-border-color', type: 'color', default: '' },
            {
                name: 'lc-border-radius', type: 'slider', options: { min: 0, max: 20, step: 1 }, default: 10,
            },
            { name: 'lc-padding' },
            {
                name: 'lc-zindex', type: 'slider', options: { min: -10, max: 20, step: 1 }, default: 0,
            },
        ],
    },
];

const checkFunction = (funcText, project, selectedView, selectedWidgets, index) => {
    try {
        let _func;
        if (typeof funcText === 'function') {
            _func = funcText;
        } else {
            // eslint-disable-next-line no-new-func
            _func = new Function('data', 'index', 'style', `return ${funcText}`);
        }
        const isHidden = [];
        for (let i = 0; i < selectedWidgets.length; i++) {
            const widget = project[selectedView].widgets[selectedWidgets[i]];
            const data = widget?.data;
            const style = widget?.style;
            if (!widget) {
                // strange error
                console.warn(`Strange error, that widget ${selectedWidgets[i]} does not exists`);
                continue;
            }
            isHidden.push(_func(data || {}, index, style || {}));
        }
        let _isHdn = isHidden[0];
        if (_isHdn && isHidden.find((hidden, i) => i > 0 && !hidden)) {
            _isHdn = false;
        }
        if (_isHdn) {
            return true;
        }
    } catch (e) {
        console.error(`Cannot execute hidden on "${funcText}": ${e}`);
    }
    return false;
};

const WIDGET_ICON_HEIGHT = 34;

const Widget = props => {
    const widgetTypes = props.widgetTypes;
    const widgets = props.project[props.selectedView]?.widgets;
    const imageRef = useRef();
    const [cssDialogOpened, setCssDialogOpened] = useState(false);
    const [jsDialogOpened, setJsDialogOpened] = useState(false);

    const fieldsData = useMemo(() => {
        let widget;
        let widgetType;
        const commonFields = {};
        const commonGroups = { common: props.selectedWidgets.length };
        const selectedWidgetsFields = [];

        widgets && props.selectedWidgets.forEach((selectedWidget, widgetIndex) => {
            widget = widgets[selectedWidget];
            if (!widget) {
                return;
            }

            widgetType = widgetTypes.find(type => type.name === widget.tpl);
            if (!widgetType) {
                return;
            }

            let params = widgetType.params;
            if (typeof widgetType.params === 'function') {
                params = widgetType.params(widget.data, null, {
                    views: props.project,
                    view: props.selectedView,
                    socket: props.socket,
                    themeType: props.themeType,
                    projectName: props.projectName,
                    adapterName: props.adapterName,
                    instance: props.instance,
                    id: selectedWidget,
                    widget,
                });
            }

            // if (widget.tpl === '_tplGroup') {
            //     const groupFields = [{
            //         name: 'common',
            //         singleName: 'common',
            //         fields: [],
            //     }, {
            //         name: 'objects',
            //         singleName: 'objects',
            //         fields: [{
            //             name: 'attrCount',
            //             type: 'slider',
            //             min: 1,
            //             max: 19,
            //             step: 1,
            //         }],
            //     }];
            //
            //     for (let i = 1; i <= widget.data.attrCount; i++) {
            //         groupFields[0].fields.push({
            //             name: `groupAttr${i}`,
            //             title: widget.data[`attrName${i}`],
            //             type: widget.data[`attrType${i}`],
            //         });
            //         groupFields[1].fields.push({
            //             name: `attrName${i}`,
            //             singleName: 'attrName',
            //             index: i,
            //         });
            //     }
            //     for (let i = 1; i <= widget.data.attrCount; i++) {
            //         groupFields[1].fields.push({
            //             name: `attrType${i}`,
            //             singleName: 'attrType',
            //             index: i,
            //             type: 'select',
            //             options: ['', 'checkbox', 'image', 'color', 'views', 'html', 'widget', 'history'],
            //         });
            //     }
            //     selectedWidgetsFields.push(groupFields);
            //     return;
            // }

            const fields = parseAttributes(params, widgetIndex, commonGroups, commonFields, widgetType.set, widget.data);

            selectedWidgetsFields.push(fields);
        });

        return {
            widget, widgetType, commonFields, commonGroups, selectedWidgetsFields,
        };
    }, [props.selectedWidgets, props.project, props.selectedView]);

    const {
        widget, commonFields, commonGroups, selectedWidgetsFields, widgetType,
    } = fieldsData;

    let fields;
    const commonValues = {};
    const isDifferent = {};

    if (props.selectedWidgets.length > 1) {
        fields = selectedWidgetsFields[0].filter(group => {
            if (commonGroups[group.name] < props.selectedWidgets.length) {
                return false;
            }
            group.fields = group.fields.filter(field =>
                commonFields[`${group.name}.${field.name}`] === props.selectedWidgets.length);
            return true;
        });

        props.selectedWidgets.forEach((selectedWidget, widgetIndex) => {
            const currentWidget = widgets[selectedWidget];
            if (!currentWidget) {
                return;
            }
            if (widgetIndex === 0) {
                commonValues.data = { ...currentWidget.data };
                commonValues.style = { ...currentWidget.style };
            } else {
                Object.keys(commonValues.data).forEach(field => {
                    if (commonValues.data[field] !== currentWidget.data[field]) {
                        commonValues.data[field] = null;
                        isDifferent[field] = true;
                    }
                });
                Object.keys(commonValues.style).forEach(field => {
                    if (commonValues.style[field] !== currentWidget.style[field]) {
                        commonValues.style[field] = null;
                        isDifferent[field] = true;
                    }
                });
            }
        });
    } else {
        fields = selectedWidgetsFields[0];
    }

    let signalsCount = 3;

    if (props.selectedWidgets.length === 1) {
        const widgetData = widgets[props.selectedWidgets[0]].data;
        signalsCount = 0;
        // detect signals count
        if (!widgetData['signals-count']) {
            let i = 0;
            while (widgetData[`signals-oid-${i}`]) {
                i++;
            }
            signalsCount = i + 1;
            if (signalsCount > 1) {
                widgetData['signals-count'] = signalsCount;
            }
        } else {
            signalsCount = parseInt(widgetData['signals-count'], 10);
        }
    }

    const fieldsBefore = useMemo(getFieldsBefore, []);
    const fieldsAfter = useMemo(
        () => getFieldsAfter(
            props.selectedWidgets.length === 1 ? widget : commonValues,
            props.project[props.selectedView].widgets,
            props.fonts,
        ),
        [props.project, props.selectedView, props.fonts],
    );
    const fieldsSignals = useMemo(() => getSignals(signalsCount, props.adapterName), [signalsCount]);
    const customFields = fields;
    if (!fields) {
        return null;
    }

    fields = [...fieldsBefore, ...fields, ...fieldsAfter, ...[fieldsSignals]];

    widgets && fields.forEach(group => {
        const found = props.selectedWidgets.find(selectedWidget => {
            const fieldFound = group.fields.find(field => {
                const fieldValue = widgets[selectedWidget][group.isStyle ? 'style' : 'data'][field.name];
                if (fieldValue === undefined) {
                    return false;
                }
                // if ((field.default || field.default === 0 || field.default === false || field.default === '') && fieldValue === field.default) {
                //     return false;
                // }
                // console.log(`Group "${group.name}" is not empty because of ${field.name}: [${JSON.stringify(field.default)}/${typeof field.default}] !== [${JSON.stringify(fieldValue)}/${typeof fieldValue}]`);
                return true;
            });
            return fieldFound !== undefined;
        });
        group.hasValues = found !== undefined;
    });

    const [accordionOpen, setAccordionOpen] = useState(
        window.localStorage.getItem('attributesWidget') && window.localStorage.getItem('attributesWidget')[0] === '{'
            ? JSON.parse(window.localStorage.getItem('attributesWidget'))
            : {},
    );

    const [clearGroup, setClearGroup] = useState(null);
    const [showWidgetCode, setShowWidgetCode] = useState(window.localStorage.getItem('showWidgetCode') === 'true');
    const [triggerAllOpened, setTriggerAllOpened] = useState(0);
    const [triggerAllClosed, setTriggerAllClosed] = useState(0);

    useEffect(() => {
        const newAccordionOpen = {};
        if (props.triggerAllOpened !== triggerAllOpened) {
            fields.forEach(group => newAccordionOpen[group.name] = true);
            setTriggerAllOpened(props.triggerAllOpened);
            window.localStorage.setItem('attributesWidget', JSON.stringify(newAccordionOpen));
            setAccordionOpen(newAccordionOpen);
        }
        if (props.triggerAllClosed !== triggerAllClosed) {
            fields.forEach(group => newAccordionOpen[group.name] = false);
            setTriggerAllClosed(props.triggerAllClosed);
            window.localStorage.setItem('attributesWidget', JSON.stringify(newAccordionOpen));
            setAccordionOpen(newAccordionOpen);
        }
    }, [props.triggerAllOpened, props.triggerAllClosed]);

    useEffect(() => {
        if (imageRef.current?.children[0]) {
            const height = imageRef.current.children[0].clientHeight;
            if (height > WIDGET_ICON_HEIGHT) {
                imageRef.current.style.transform = `scale(${WIDGET_ICON_HEIGHT / height})`;
            }
        }
    }, [imageRef]);

    // change groups
    const onGroupMove = useCallback((e, index, iterable, direction) => {
        e.stopPropagation();
        const project = JSON.parse(JSON.stringify(props.project));
        const oldGroup = fields.find(f => f.name === `${iterable.group}-${index}`);
        const _widgets = project[props.selectedView].widgets;

        // if deletion
        if (!direction) {
            if (iterable.indexTo) {
                const lastGroup = fields.find(f => f.singleName  === iterable.group && f.iterable?.isLast);
                const newAccordionOpen = { ...accordionOpen };
                for (let idx = index; idx < lastGroup.index; idx++) {
                    const idxGroup = fields.find(f => f.name === `${iterable.group}-${idx}`);
                    const idxGroupPlus = fields.find(f => f.name === `${iterable.group}-${idx + 1}`);
                    // for every selected widget
                    props.selectedWidgets.forEach(wid => {
                        const widgetData = _widgets[wid].data;
                        // move all fields of the group to -1
                        idxGroup.fields.forEach((attr, i) =>
                            widgetData[idxGroup.fields[i].name] = widgetData[idxGroupPlus.fields[i].name]);

                        // move the group-used flag
                        widgetData[`g_${iterable.group}-${idx}`] = widgetData[`g_${iterable.group}-${idx + 1}`];

                        // move the opened flag
                        newAccordionOpen[`${iterable.group}-${idx}`] = newAccordionOpen[`${iterable.group}-${idx + 1}`];
                    });
                }

                // delete last group
                props.selectedWidgets.forEach(wid => {
                    // order all attributes for better readability
                    const widgetData = _widgets[wid].data;

                    // delete all fields of the group
                    lastGroup.fields.forEach(attr => {
                        delete widgetData[attr.name];
                    });

                    // delete group-used flag
                    delete widgetData[`g_${iterable.group}-${lastGroup.index}`];

                    // delete the opened flag
                    delete newAccordionOpen[`${iterable.group}-${lastGroup.index}`];
                    widgetData[iterable.indexTo]--;
                });
                setAccordionOpen(newAccordionOpen);
                props.changeProject(project);
            }
            return;
        }
        if (direction === true) {
            const newAccordionOpen = { ...accordionOpen };
            const lastGroup = fields.find(f => f.singleName  === iterable.group && f.iterable?.isLast);
            // add one line
            const newIndex = lastGroup.index + 1;
            props.selectedWidgets.forEach(wid => {
                // order all attributes for better readability
                const widgetData = _widgets[wid].data;

                lastGroup.fields.forEach((attr, i) => {
                    const name = lastGroup.fields[i].name.replace(/\d?\d+$/, newIndex);
                    widgetData[name] = null;
                });

                // enable group-used flag
                widgetData[`g_${iterable.group}-${newIndex}`] = true;

                // enable the opened flag
                newAccordionOpen[`${iterable.group}-${newIndex}`] = true;
                widgetData[iterable.indexTo] = newIndex;
                setAccordionOpen(newAccordionOpen);
                props.changeProject(project);
            });
            return;
        }

        const newIndex = index + direction;
        const newGroup = fields.find(f => f.name === `${iterable.group}-${newIndex}`);

        // for every selected widget
        props.selectedWidgets.forEach(wid => {
            // order all attributes for better readability
            const oldWidgetData = _widgets[wid].data;
            const widgetData = {};
            Object.keys(oldWidgetData).sort().forEach(key => widgetData[key] = oldWidgetData[key]);
            _widgets[wid].data = widgetData;

            // switch all fields of the group
            oldGroup.fields.forEach((attr, i) => {
                const value = widgetData[newGroup.fields[i].name];
                widgetData[newGroup.fields[i].name] = widgetData[attr.name];
                widgetData[attr.name] = value;
            });

            // switch group-used flag
            let value = widgetData[`g_${iterable.group}-${newIndex}`];
            widgetData[`g_${iterable.group}-${newIndex}`] = widgetData[`g_${iterable.group}-${index}`];
            widgetData[`g_${iterable.group}-${index}`] = value;

            if (accordionOpen[`${iterable.group}-${newIndex}`] !== accordionOpen[`${iterable.group}-${index}`]) {
                const newAccordionOpen = { ...accordionOpen };
                // copy the opened flag
                value = newAccordionOpen[`${iterable.group}-${newIndex}`];
                newAccordionOpen[`${iterable.group}-${newIndex}`] = newAccordionOpen[`${iterable.group}-${index}`];
                newAccordionOpen[`${iterable.group}-${index}`] = value;
                setAccordionOpen(newAccordionOpen);
            }
        });
        props.changeProject(project);
    }, [props.project, fields]);

    if (!widgets) {
        return null;
    }

    const allOpened = !fields.find(group => !accordionOpen[group.name]);
    const allClosed = !fields.find(group => accordionOpen[group.name]);

    if (props.isAllClosed !== allClosed) {
        setTimeout(() => props.setIsAllClosed(allClosed), 50);
    }
    if (props.isAllOpened !== allOpened) {
        setTimeout(() => props.setIsAllOpened(allOpened), 50);
    }

    let list;
    // If selected only one widget, show its icon
    if (props.selectedWidgets.length === 1) {
        const tpl = widgets[props.selectedWidgets[0]].tpl;
        const _widgetType = getWidgetTypes().find(foundWidgetType => foundWidgetType.name === tpl);
        let widgetLabel = _widgetType?.title || '';
        let widgetColor = _widgetType?.setColor;
        if (_widgetType?.label) {
            widgetLabel = I18n.t(_widgetType.label);
        }
        // remove legacy stuff
        widgetLabel = widgetLabel.split('<br')[0];
        widgetLabel = widgetLabel.split('<span')[0];
        widgetLabel = widgetLabel.split('<div')[0];

        let setLabel = _widgetType?.set;
        if (_widgetType?.setLabel) {
            setLabel = I18n.t(_widgetType.setLabel);
        } else if (setLabel) {
            const widgetWithSetLabel = widgetTypes.find(w => w.set === setLabel && w.setLabel);
            if (widgetWithSetLabel) {
                widgetColor = widgetWithSetLabel.setColor;
                setLabel = I18n.t(widgetWithSetLabel.setLabel);
            }
        }

        let widgetIcon = _widgetType?.preview || '';
        if (widgetIcon.startsWith('<img')) {
            const prev = widgetIcon.match(/src="([^"]+)"/);
            if (prev && prev[1]) {
                widgetIcon = prev[1];
            }
        }

        let img;
        if (_widgetType?.preview?.startsWith('<img')) {
            const m = _widgetType?.preview.match(/src="([^"]+)"/) || _widgetType?.preview.match(/src='([^']+)'/);
            if (m) {
                img = <img src={m[1]} className={props.classes.icon} alt={props.selectedWidgets[0]} />;
            }
        } else if (_widgetType?.preview && (_widgetType?.preview.endsWith('.svg') || _widgetType?.preview.endsWith('.png') || _widgetType?.preview.endsWith('.jpg'))) {
            img = <img src={_widgetType?.preview} className={props.classes.icon} alt={props.selectedWidgets[0]} />;
        }

        if (!img) {
            img = <span
                className={props.classes.widgetImage}
                ref={imageRef}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={
                    { __html: _widgetType?.preview }
                }
            />;
        }

        let widgetBackColor;
        if (widgetColor) {
            widgetBackColor = Utils.getInvertedColor(widgetColor, props.themeType, false);
            if (widgetBackColor === '#DDD') {
                widgetBackColor = '#FFF';
            } else if (widgetBackColor === '#111') {
                widgetBackColor = '#000';
            }
        }
        if (tpl === '_tplGroup') {
            widgetLabel = I18n.t('group');
        }
        if (widgets[props.selectedWidgets[0]].marketplace) {
            setLabel = `${widgets[props.selectedWidgets[0]].marketplace.name}`;
            widgetLabel = `${I18n.t('version')} ${widgets[props.selectedWidgets[0]].marketplace.version}`;
        }
        list = <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {widgetIcon ? <div className={props.classes.widgetIcon}>{img}</div> : null}
            <div className={props.classes.widgetName}>{props.selectedWidgets[0]}</div>
            <div className={props.classes.widgetType}>
                <div
                    style={{
                        fontWeight: 'bold',
                        color: widgetColor,
                        backgroundColor: widgetBackColor,
                    }}
                    className={Utils.clsx(props.classes.widgetNameText, widgetBackColor && props.classes.coloredWidgetSet)}
                >
                    {setLabel}
                </div>
                <div className={props.classes.widgetNameText}>{widgetLabel}</div>
            </div>
            {!widgets[props.selectedWidgets[0]].marketplace && <>
                {window.location.port === '3000' ? <Button onClick={() => setCssDialogOpened(true)}>CSS</Button> : null}
                {window.location.port === '3000' ? <Button onClick={() => setJsDialogOpened(true)}>JS</Button> : null}
                {cssDialogOpened ? <WidgetCSS
                    onClose={() => setCssDialogOpened(false)}
                    widget={widgets[props.selectedWidgets[0]]}
                    onChange={value => {
                        const project = JSON.parse(JSON.stringify(props.project));
                        project[props.selectedView].widgets[props.selectedWidgets[0]].css = value;
                        props.changeProject(project);
                    }}
                    editMode={props.editMode}
                /> : null}
                {jsDialogOpened ? <WidgetJS
                    onClose={() => setJsDialogOpened(false)}
                    widget={widgets[props.selectedWidgets[0]]}
                    onChange={value => {
                        const project = JSON.parse(JSON.stringify(props.project));
                        project[props.selectedView].widgets[props.selectedWidgets[0]].js = value;
                        props.changeProject(project);
                    }}
                    editMode={props.editMode}
                /> : null}
            </>}
        </div>;
    } else {
        list = props.selectedWidgets.join(', ');
    }

    let jsonCustomFields = null;
    if (showWidgetCode) {
        try {
            jsonCustomFields = JSON.stringify(customFields, null, 2);
        } catch (e) {
            // ignore
        }
    }

    return <>
        <div style={{ width: '100%', overflow: 'hidden' }}>
            {list}
        </div>

        <div style={{ height: 'calc(100% - 34px)', overflowY: 'auto' }}>
            {fields.map(group => {
                if (group.hidden) {
                    if (checkFunction(group.hidden, props.project, props.selectedView, props.selectedWidgets)) {
                        return null;
                    }
                }

                return <Accordion
                    classes={{
                        root: props.classes.clearPadding,
                        expanded: props.classes.clearPadding,
                    }}
                    square
                    key={group.name}
                    elevation={0}
                    expanded={!!(accordionOpen[group.name] && group.hasValues)}
                    onChange={(e, expanded) => {
                        const newAccordionOpen = JSON.parse(JSON.stringify(accordionOpen));
                        newAccordionOpen[group.name] = expanded;
                        window.localStorage.setItem('attributesWidget', JSON.stringify(newAccordionOpen));
                        setAccordionOpen(newAccordionOpen);
                    }}
                >
                    <AccordionSummary
                        classes={{
                            root: Utils.clsx(props.classes.clearPadding, accordionOpen[group.name]
                                ? props.classes.groupSummaryExpanded : props.classes.groupSummary, props.classes.lightedPanel),
                            content: props.classes.clearPadding,
                            expanded: props.classes.clearPadding,
                            expandIcon: props.classes.clearPadding,
                        }}
                        expandIcon={group.hasValues ? <ExpandMoreIcon /> : <div className={props.classes.emptyMoreIcon} />}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                width: '100%',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                {ICONS[`group.${group.singleName || group.name}`] ? ICONS[`group.${group.singleName || group.name}`] : null}
                                {group.label ?
                                    I18n.t(group.label) + (group.index !== undefined ? ` [${group.index}]` : '')
                                    :
                                    (window.vis._(`group_${group.singleName || group.name}`) + (group.index !== undefined ? ` [${group.index}]` : ''))}
                            </div>
                            {group.iterable ? <>
                                <div className={props.classes.grow} />
                                {group.iterable.indexTo ? <Tooltip title={I18n.t('Delete')}>
                                    <IconButton
                                        className={props.classes.groupButton}
                                        size="small"
                                        onClick={e => onGroupMove(e, group.index, group.iterable, 0)}
                                    >
                                        <Delete />
                                    </IconButton>
                                </Tooltip> : null}
                                {group.iterable.isFirst ?
                                    <div className={props.classes.groupButton} /> :
                                    <Tooltip title={I18n.t('Move up')}>
                                        <IconButton
                                            className={props.classes.groupButton}
                                            size="small"
                                            onClick={e => onGroupMove(e, group.index, group.iterable, -1)}
                                        >
                                            <ArrowUpward />
                                        </IconButton>
                                    </Tooltip>}
                                {group.iterable.isLast ?
                                    (group.iterable.indexTo ? <Tooltip title={I18n.t('Add')}>
                                        <IconButton
                                            className={props.classes.groupButton}
                                            size="small"
                                            onClick={e => onGroupMove(e, group.index, group.iterable, true)}
                                        >
                                            <Add />
                                        </IconButton>
                                    </Tooltip> : <div className={props.classes.groupButton} />)
                                    :
                                    <Tooltip title={I18n.t('Move down')}>
                                        <IconButton
                                            className={props.classes.groupButton}
                                            size="small"
                                            onClick={e => onGroupMove(e, group.index, group.iterable, 1)}
                                        >
                                            <ArrowDownward />
                                        </IconButton>
                                    </Tooltip>}
                            </> : null}
                            <div>
                                <Checkbox
                                    checked={group.hasValues}
                                    onClick={e => {
                                        if (group.hasValues) {
                                            setClearGroup(group);
                                        } else {
                                            const project = JSON.parse(JSON.stringify(props.project));
                                            props.selectedWidgets.forEach(selectedWidget => {
                                                group.fields.forEach(field => {
                                                    if (project[props.selectedView].widgets[selectedWidget][group.isStyle ? 'style' : 'data'][field.name] === undefined) {
                                                        project[props.selectedView].widgets[selectedWidget][group.isStyle ? 'style' : 'data'][field.name] = field.default || null;
                                                    }
                                                });
                                                project[props.selectedView].widgets[selectedWidget].data[`g_${group.name}`] = true;
                                            });
                                            const newAccordionOpen = JSON.parse(JSON.stringify(accordionOpen));
                                            newAccordionOpen[group.name] = true;
                                            window.localStorage.setItem('attributesWidget', JSON.stringify(newAccordionOpen));
                                            setAccordionOpen(newAccordionOpen);
                                            props.changeProject(project);
                                        }
                                        e.stopPropagation();
                                    }}
                                    size="small"
                                    classes={{ root: Utils.clsx(props.classes.fieldContent, props.classes.clearPadding, props.classes.checkBox) }}
                                />
                            </div>
                        </div>
                    </AccordionSummary>
                    <AccordionDetails style={{ flexDirection: 'column', padding: 0, margin: 0 }}>
                        <table style={{ width: '100%' }}>
                            <tbody>
                                {
                                    group.fields.map((field, fieldIndex) => {
                                        if (!field) {
                                            return null;
                                        }
                                        let error;
                                        let disabled;
                                        if (field.hidden) {
                                            if (checkFunction(field.hidden, props.project, props.selectedView, props.selectedWidgets, field.index)) {
                                                return null;
                                            }
                                        }
                                        if (field.type === 'help') {
                                            return <tr key={fieldIndex} className={props.classes.fieldRow}>
                                                <td colSpan={2} className={props.classes.fieldHelp} style={field.style}>
                                                    {field.noTranslation ? field.text : I18n.t(field.text)}
                                                </td>
                                            </tr>;
                                        }

                                        if (field.error) {
                                            error = checkFunction(field.error, props.project, props.selectedView, props.selectedWidgets, field.index);
                                        }
                                        if (field.disabled) {
                                            if (field.disabled === true) {
                                                disabled = true;
                                            } else {
                                                disabled = !!checkFunction(field.disabled, props.project, props.selectedView, props.selectedWidgets, field.index);
                                            }
                                        }
                                        let label;
                                        if (field.label === '') {
                                            label = '';
                                        } else if (field.title) {
                                            label = field.title;
                                        } else if (field.label) {
                                            label = I18n.t(field.label);
                                        } else {
                                            label = window.vis._(field.singleName || field.name) + (field.index !== undefined ? ` [${field.index}]` : '');
                                        }

                                        const labelStyle = {};

                                        if (label.trim().startsWith('<b')) {
                                            label = label.match(/<b>(.*?)<\/b>/)[1];
                                            labelStyle.fontWeight = 'bold';
                                            labelStyle.color = '#4dabf5';
                                        }
                                        if (label.trim().startsWith('<i')) {
                                            label = label.match(/<i>(.*?)<\/i>/)[1];
                                            labelStyle.fontStyle = 'italic';
                                        }

                                        return <tr key={fieldIndex} className={props.classes.fieldRow}>
                                            {field.type === 'delimiter' ?
                                                <td colSpan="2"><Divider style={{ borderBottomWidth: 'thick' }} /></td>
                                                : <>
                                                    <td
                                                        className={Utils.clsx(props.classes.fieldTitle, disabled && props.classes.fieldTitleDisabled, error && props.classes.fieldTitleError)}
                                                        title={field.tooltip ? I18n.t(field.tooltip) : null}
                                                        style={labelStyle}
                                                    >
                                                        {ICONS[field.singleName || field.name] ? ICONS[field.singleName || field.name] : null}
                                                        {label}
                                                        {field.type === 'image' && !isDifferent[field.name] && widget && widget.data[field.name] ?
                                                            <div className={props.classes.smallImageDiv}>
                                                                <img
                                                                    src={widget.data[field.name].startsWith('_PRJ_NAME/') ?
                                                                        widget.data[field.name].replace('_PRJ_NAME/', `../${props.adapterName}.${props.instance}/${props.projectName}/`)
                                                                        :
                                                                        widget.data[field.name]}
                                                                    className={props.classes.smallImage}
                                                                    onError={e => {
                                                                        e.target.onerror = null;
                                                                        e.target.style.display = 'none';
                                                                    }}
                                                                    alt={field.name}
                                                                />
                                                            </div> : null}
                                                        {group.isStyle ?
                                                            <ColorizeIcon
                                                                fontSize="small"
                                                                className={props.classes.colorize}
                                                                onClick={() => props.cssClone(field.name, newValue => {
                                                                    if (newValue !== null && newValue !== undefined) {
                                                                        const project = JSON.parse(JSON.stringify(props.project));
                                                                        props.selectedWidgets.forEach(selectedWidget => {
                                                                            if (project[props.selectedView].widgets[selectedWidget]) {
                                                                                project[props.selectedView].widgets[selectedWidget].style = project[props.selectedView].widgets[selectedWidget].style || {};
                                                                                project[props.selectedView].widgets[selectedWidget].style[field.name] = newValue;
                                                                            }
                                                                        });
                                                                        props.changeProject(project);
                                                                    }
                                                                })}
                                                            /> : null}
                                                        {field.tooltip ? <InfoIcon className={props.classes.infoIcon} /> : null}
                                                    </td>
                                                    <td className={props.classes.fieldContent}>
                                                        <div className={props.classes.fieldInput}>
                                                            {accordionOpen[group.name] && group.hasValues ?
                                                                <WidgetField
                                                                    widgetType={widgetType}
                                                                    themeType={props.themeType}
                                                                    error={error}
                                                                    disabled={disabled}
                                                                    field={field}
                                                                    widget={props.selectedWidgets.length > 1 ? commonValues : widget}
                                                                    widgetId={props.selectedWidgets.length > 1 ? null : props.selectedWidgets[0]}
                                                                    isStyle={group.isStyle}
                                                                    index={group.index}
                                                                    isDifferent={isDifferent[field.name]}
                                                                    {...props}
                                                                /> : null}
                                                        </div>
                                                    </td>
                                                </>}
                                        </tr>;
                                    })
                                }
                            </tbody>
                        </table>
                    </AccordionDetails>
                </Accordion>;
            })}
            {clearGroup ? <IODialog
                title="Are you sure"
                onClose={() => setClearGroup(null)}
                open={!0}
                action={() => {
                    const project = JSON.parse(JSON.stringify(props.project));
                    const group = clearGroup;
                    props.selectedWidgets.forEach(selectedWidget => {
                        group.fields.forEach(field => {
                            delete project[props.selectedView].widgets[selectedWidget][group.isStyle ? 'style' : 'data'][field.name];
                        });
                        delete project[props.selectedView].widgets[selectedWidget].data[`g_${group.name}`];
                    });
                    props.changeProject(project);
                }}
                actionTitle="Clear"
            >
                {I18n.t('Fields of group will be cleaned')}
            </IODialog> : null}
            <Button
                style={{ opacity: showWidgetCode ? 1 : 0 }}
                onClick={() => {
                    setShowWidgetCode(!showWidgetCode);
                    window.localStorage.setItem('showWidgetCode', showWidgetCode ? 'false' : 'true');
                }}
                startIcon={<CodeIcon />}
            >
                { showWidgetCode ? I18n.t('hide code') : I18n.t('show code') }
            </Button>
            {showWidgetCode ? <pre>
                {JSON.stringify(widget, null, 2)}
                {jsonCustomFields}
            </pre> : null}
        </div>
    </>;
};

const WidgetContainer = props => {
    const widgetTypes = useMemo(() => getWidgetTypes(), [props.widgetsLoaded]);
    const widgets = props.project[props.selectedView]?.widgets;

    let widgetsExist = 0;
    widgets && props.selectedWidgets.forEach(selectedWidget => {
        if (widgets[selectedWidget] && widgetTypes.find(type => type.name === widgets[selectedWidget].tpl)) {
            widgetsExist++;
        }
    });
    if (!widgets || props.selectedWidgets.length !== widgetsExist) {
        return null;
    }

    return <Widget widgetTypes={widgetTypes} {...props} />;
};

WidgetContainer.propTypes = {
    adapterName: PropTypes.string.isRequired,
    themeType: PropTypes.string.isRequired,
    changeProject: PropTypes.func,
    classes: PropTypes.object,
    cssClone: PropTypes.func,
    fonts: PropTypes.array,
    instance: PropTypes.number.isRequired,
    project: PropTypes.object,
    projectName: PropTypes.string.isRequired,
    selectedView: PropTypes.string,
    selectedWidgets: PropTypes.array,
    widgetsLoaded: PropTypes.bool,

    setIsAllOpened: PropTypes.func,
    setIsAllClosed: PropTypes.func,
    isAllOpened: PropTypes.bool,
    isAllClosed: PropTypes.bool,
    triggerAllOpened: PropTypes.number,
    triggerAllClosed: PropTypes.number,
};

export default withStyles(styles)(WidgetContainer);
