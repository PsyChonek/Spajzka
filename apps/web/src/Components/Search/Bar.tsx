import React, {useEffect, useState} from 'react';
import '../../CSS/Search.css'
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';

const Bar = (props: { onSearchSubmit: Function }) => {
    const [term, setTerm] = useState('');

    useEffect(() => {
        props.onSearchSubmit(term);
    }, [term]);

    return (
        <div className='searchbar'>
            <wa-input
                className='searchbar-input'
                type='text'
                placeholder="Vyhledej podle názvu. . ."
                onWaInput={(e: any) => setTerm(e.target.value)}
                value={term}
                appearance="outlined"
                size="medium"
                style={{ width: '100%' } as React.CSSProperties}
            >
                <wa-icon name="magnifying-glass" slot="start"></wa-icon>
            </wa-input>
        </div>
    );
};

export default Bar;