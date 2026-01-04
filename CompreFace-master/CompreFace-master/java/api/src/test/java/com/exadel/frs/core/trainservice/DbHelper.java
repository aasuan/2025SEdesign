package com.exadel.frs.core.trainservice;

import com.exadel.frs.commonservice.entity.App;
import com.exadel.frs.core.trainservice.repository.AppRepository;
import com.exadel.frs.testutil.BaseDbHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DbHelper extends BaseDbHelper {

    @Autowired
    AppRepository appRepository;

    @Override
    protected App saveApp(App app) {
        return appRepository.save(app);
    }
}
