import PropTypes from 'prop-types';

import { useEffect, useRef, useState } from 'react';
import IODialog from '../Components/IODialog';
import CustomAceEditor from '../Components/CustomAceEditor';
import { useFocus } from '../Utils';

const WidgetImportDialog = props => {
    const [data, setData] = useState('');
    const [errors, setErrors] = useState([]);

    const inputField = useFocus(true, true, true);

    const editor = useRef(null);

    useEffect(() => {
        if (editor.current) {
            editor.current.editor.getSession().on('changeAnnotation', () => {
                if (editor.current) {
                    setErrors(editor.current.editor.getSession().getAnnotations());
                }
            });
        }
    }, [editor.current]);

    const importWidgets = () => {
        const project = JSON.parse(JSON.stringify(props.project));
        const widgets = JSON.parse(data);
        let newKeyNumber = props.getNewWidgetIdNumber();
        let newGroupKeyNumber = props.getNewWidgetIdNumber(true);
        const newWidgets = {};

        widgets.forEach(widget => {
            if (widget.tpl === '_tplGroup') {
                const newKey = `g${newGroupKeyNumber.toString().padStart(6, '0')}`;
                newWidgets[newKey] = widget;
                // find all widgets that belong to this group and change groupid
                let w;
                do {
                    w = widgets.find(item => item.groupid === widget._id);
                    if (w) {
                        w.groupid = newKey;
                    }
                } while (w);

                newGroupKeyNumber++;
            } else {
                const newKey = `w${newKeyNumber.toString().padStart(6, '0')}`;
                newWidgets[newKey] = widget;
                if (widget.grouped && newWidgets[widget.groupid] && newWidgets[widget.groupid].data && newWidgets[widget.groupid].data.members) {
                    // find group
                    const pos = newWidgets[widget.groupid].data.members.indexOf(widget._id);
                    if (pos !== -1) {
                        newWidgets[widget.groupid].data.members[pos] = newKey;
                    }
                }
                newKeyNumber++;
            }
        });

        Object.keys(newWidgets).forEach(wid => delete newWidgets[wid]._id);

        project[props.selectedView].widgets = { ...project[props.selectedView].widgets, ...newWidgets };

        props.changeProject(project);
    };

    return <IODialog
        open={!0}
        onClose={props.onClose}
        title="Import widgets"
        closeTitle="Close"
        actionTitle="Import"
        action={() => {
            importWidgets();
            props.onClose();
        }}
        actionDisabled={!!errors.length}
    >
        <CustomAceEditor
            type="json"
            themeType={props.themeType}
            refEditor={node => {
                editor.current = node;
                inputField.current = node;
            }}
            value={data}
            onChange={newValue => setData(newValue)}
            height={200}
        />
    </IODialog>;
};

WidgetImportDialog.propTypes = {
    changeProject: PropTypes.func,
    onClose: PropTypes.func,
    project: PropTypes.object,
    themeType: PropTypes.string,
    selectedView: PropTypes.string,
};
export default WidgetImportDialog;
