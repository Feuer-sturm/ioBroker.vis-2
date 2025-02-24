import PropTypes from 'prop-types';
import { useRef, useState } from 'react';

import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';

import { Close } from '@mui/icons-material';

import { I18n } from '@iobroker/adapter-react-v5';

import CustomAceEditor from '../../Components/CustomAceEditor';

const WidgetCSS = props => {
    const [value, setValue] = useState(props.widget.css || '');
    const timeout = useRef(null);

    return <Dialog open={!0} onClose={props.onClose} fullWidth>
        <DialogTitle>{I18n.t('Widget CSS')}</DialogTitle>
        <DialogContent style={{ height: 400 }}>
            <CustomAceEditor
                type="css"
                themeType={props.themeType}
                readOnly={!props.editMode}
                value={value}
                onChange={v => {
                    setValue(v);
                    if (timeout.current) {
                        clearTimeout(timeout.current);
                        timeout.current = null;
                    }
                    timeout.current = setTimeout(() => {
                        timeout.current = null;
                        props.onChange(v);
                    }, 1000);
                }}
            />
        </DialogContent>
        <DialogActions>
            <Button
                onClick={props.onClose}
                color="primary"
                variant="contained"
                startIcon={<Close />}
            >
                {I18n.t('Close')}
            </Button>
        </DialogActions>
    </Dialog>;
};

WidgetCSS.propTypes = {
    themeType: PropTypes.string,
    editMode: PropTypes.bool,
    onClose: PropTypes.func,
    onChange: PropTypes.func,
    widget: PropTypes.object,
};

export default WidgetCSS;
