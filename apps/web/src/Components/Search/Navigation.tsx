import React from 'react';
import '@awesome.me/webawesome/dist/components/button/button.js';

function Navigation() {
    return (
        <div>
            <nav className="pagination justify-content-center">
                <wa-button variant="neutral" appearance="outlined" size="small">
                    Previous
                </wa-button>
                <wa-button variant="brand" size="small" style={{ margin: '0 0.5rem' } as React.CSSProperties}>
                    1
                </wa-button>
                <wa-button variant="neutral" appearance="outlined" size="small">
                    Next
                </wa-button>
            </nav>
        </div>
    );
}

export default Navigation;