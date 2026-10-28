import { useContext, useEffect, useRef, useState } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { UserContext } from "../App";
import Icon from "./Icon";
import { useNewNotification } from "../hooks/queries";

const SideNav = () => {

    let { userAuth: {access_token} } = useContext(UserContext);
    // Authoritative, server-backed badge — see MobileTopBar for why this isn't a context flag.
    const { data: notificationData } = useNewNotification();
    const new_notification_available = notificationData?.new_notification_available;

    let page = location.pathname.split("/")[2];

    let [ pageState, setpageState ] = useState(page.replace('-', ' '));
    let [ showSideNav, setShowSideNav ] = useState(false);

    let activeTabLine = useRef();
    let sideBarIconTab = useRef();
    let pageStateTab = useRef();

    const changePageState = (e) => {
        
        let { offsetWidth, offsetLeft } = e.target;

        activeTabLine.current.style.width = offsetWidth + "px";
        activeTabLine.current.style.left = offsetLeft + "px";

        if(e.target == sideBarIconTab.current){
            setShowSideNav(true);
        }else{
            setShowSideNav(false);
        }

    }

    useEffect(() => {
        setShowSideNav(false);
        pageStateTab.current.click();
    }, [pageState])

    return(
        access_token === null ? <Navigate to="/signin" /> :
        <>
            <section className="relative flex items-start py-0 m-0 max-md:flex-col" style={{ gap: 0, padding: 0 }}>
                
                <div className="md:sticky top-0 z-30">

                    <div className="md:hidden bg-surface py-1 border-b border-border flex flex-nowrap overflow-x-auto">
                        <button ref={sideBarIconTab} className="p-5 capitalize" onClick={changePageState} aria-label="Open menu">
                            <Icon name="menu" className="pointer-events-none" />
                        </button>

                        <button ref={pageStateTab} className="p-5 capitalize font-medium" onClick={changePageState}>
                            {pageState}
                        </button>

                        <hr ref={activeTabLine} className="absolute bottom-0 duration-500 border-black border-[1.5px]" />
                    </div>

                    <div className={"min-w-[200px] h-[calc(100vh-80px-60px)] md:h-cover md:sticky top-0 overflow-y-auto py-6 pl-0 pr-0 md:border-border md:border-r absolute max-md:top-[64px] bg-surface max-md:w-full max-md:px-4 duration-500 " + (!showSideNav ? "max-md:opacity-0 max-md:pointer-events-none" : "opacity-100 pointer-events-auto")}>
                        
                        <h1 className="text-sm font-semibold text-dark-grey uppercase tracking-wider mb-3 pl-5">Dashboard</h1>
                        <hr className="border-border mb-6 mr-6" />

                        <NavLink to="/dashboard/blogs" onClick={(e) => setpageState(e.target.innerText)} className="sidebar-link">
                            <Icon name="article" />
                            Blogs
                        </NavLink>

                        <NavLink to="/dashboard/notifications" onClick={(e) => setpageState(e.target.innerText)} className="sidebar-link">
                            <div className="relative">
                                <Icon name="notifications" />
                                {
                                    new_notification_available ? 
                                    <span className="notification-badge !w-2 !h-2 !top-0 !right-0"></span> : " "
                                }
                            </div>
                            Notification
                        </NavLink>

                        <NavLink to="/dashboard/publications" onClick={(e) => setpageState(e.target.innerText)} className="sidebar-link">
                            <Icon name="import_contacts" />
                            Publications
                        </NavLink>

                        <NavLink to="/messages" onClick={(e) => setpageState(e.target.innerText)} className="sidebar-link">
                            <Icon name="chat" />
                            Messages
                        </NavLink>

                        <NavLink to="/editor" onClick={(e) => setpageState(e.target.innerText)} className="sidebar-link">
                            <Icon name="edit_note" />
                            Write
                        </NavLink>

                        <h1 className="text-sm font-semibold text-dark-grey uppercase tracking-wider mt-12 mb-3 pl-5">Settings</h1>
                        <hr className="border-border mb-6 mr-6" />

                        <NavLink to="/settings/edit-profile" onClick={(e) => setpageState(e.target.innerText)} className="sidebar-link">
                            <Icon name="person" />
                            Edit Profile
                        </NavLink>

                        <NavLink to="/settings/change-password" onClick={(e) => setpageState(e.target.innerText)} className="sidebar-link">
                            <Icon name="lock" />
                            Change Password
                        </NavLink>

                    </div>

                </div>

                <div className="max-md:mt-2 mt-5 w-full pl-4 lg:pl-8">
                    <Outlet />
                </div>

            </section>
        
        </>
    )
}

export default SideNav;
