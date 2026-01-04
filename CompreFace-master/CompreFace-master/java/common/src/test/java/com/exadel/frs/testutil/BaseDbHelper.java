package com.exadel.frs.testutil;

import static com.exadel.frs.testutil.ItemsBuilder.makeApp;
import static com.exadel.frs.testutil.ItemsBuilder.makeEmbedding;
import static com.exadel.frs.testutil.ItemsBuilder.makeImg;
import static com.exadel.frs.testutil.ItemsBuilder.makeModel;
import static com.exadel.frs.testutil.ItemsBuilder.makeSubject;
import com.exadel.frs.commonservice.entity.App;
import com.exadel.frs.commonservice.entity.Embedding;
import com.exadel.frs.commonservice.entity.Img;
import com.exadel.frs.commonservice.entity.Model;
import com.exadel.frs.commonservice.entity.ModelStatistic;
import com.exadel.frs.commonservice.entity.Subject;
import com.exadel.frs.commonservice.enums.ModelType;
import com.exadel.frs.commonservice.repository.EmbeddingRepository;
import com.exadel.frs.commonservice.repository.ImgRepository;
import com.exadel.frs.commonservice.repository.ModelRepository;
import com.exadel.frs.commonservice.repository.ModelStatisticRepository;
import com.exadel.frs.commonservice.repository.SubjectRepository;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;

public abstract class BaseDbHelper {

    @Autowired
    protected ModelRepository modelRepository;

    @Autowired
    protected SubjectRepository subjectRepository;

    @Autowired
    protected EmbeddingRepository embeddingRepository;

    @Autowired
    protected ImgRepository imgRepository;

    @Autowired
    protected ModelStatisticRepository modelStatisticRepository;

    protected abstract App saveApp(App app);

    public Model insertModel() {
        return insertModel(ModelType.RECOGNITION);
    }

    public Model insertModel(ModelType type) {
        var apiKey = UUID.randomUUID().toString();
        var app = saveApp(makeApp(apiKey));
        return modelRepository.save(makeModel(apiKey, type, app));
    }

    public ModelStatistic insertModelStatistic(int requestCount, LocalDateTime createdDate, Model model) {
        var statistic = ModelStatistic.builder()
                                      .requestCount(requestCount)
                                      .createdDate(createdDate)
                                      .model(model)
                                      .build();

        return modelStatisticRepository.save(statistic);
    }

    public ModelStatistic insertModelStatistic(Model model, int requestCount, LocalDateTime createDate) {
        return insertModelStatistic(requestCount, createDate, model);
    }

    public Subject insertSubject(Model model, String subjectName) {
        return insertSubject(model.getApiKey(), subjectName);
    }

    public Subject insertSubject(String apiKey, String subjectName) {
        return subjectRepository.save(makeSubject(apiKey, subjectName));
    }

    public Subject insertSubject(String subjectName) {
        var model = insertModel();
        return insertSubject(model.getApiKey(), subjectName);
    }

    public Embedding insertEmbeddingNoImg(Subject subject) {
        return insertEmbeddingNoImg(subject, null);
    }

    public Embedding insertEmbeddingNoImg(Subject subject, String calculator) {
        return insertEmbeddingNoImg(subject, calculator, null);
    }

    public Embedding insertEmbeddingNoImg(Subject subject, String calculator, double[] embedding) {
        return embeddingRepository.save(makeEmbedding(subject, calculator, embedding, null));
    }

    public Embedding insertEmbeddingWithImg(Subject subject) {
        return insertEmbeddingWithImg(subject, null, null);
    }

    public Embedding insertEmbeddingWithImg(Subject subject, String calculator) {
        return insertEmbeddingWithImg(subject, calculator, null);
    }

    public Embedding insertEmbeddingWithImg(Subject subject, String calculator, double[] embedding) {
        var img = insertImg();
        return insertEmbeddingWithImg(subject, calculator, embedding, img);
    }

    public Embedding insertEmbeddingWithImg(Subject subject, String calculator, double[] embedding, Img img) {
        return embeddingRepository.save(makeEmbedding(subject, calculator, embedding, img));
    }

    public Img insertImg() {
        return imgRepository.save(makeImg());
    }
}
