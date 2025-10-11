import React from 'react';

function Navigation() {
    return (
        <div>
            <nav className="pagination justify-content-center">
                <button className="page-link">Previous</button>
                <button className="page-link active">1</button>
                <button className="page-link">Next</button>
            </nav>
        </div>
    );
}

export default Navigation;